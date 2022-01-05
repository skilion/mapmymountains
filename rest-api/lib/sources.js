const assert = require('assert');
const common = require('./common');
const { db, pgp } = require('./db');

module.exports.selectAll = function () {
	const query = `
		SELECT id, description, type
		FROM source
		WHERE type != 'invisible'
		ORDER BY id;
	`;
	return db.any(query);
}

/**
 * Select info about a source.
 * @param {string} sourceId 
 * @param {number[][]} [area] - The area in the format: [[x1, y1], ..., [xN, yN]]
 */
module.exports.selectInfo = function (sourceId, area) {
	area = common.arrayToPsqlArea(area);
	const query = `
		SELECT id, description, type, (
			SELECT count(*) AS num_peaks
			FROM source_element
			WHERE source_id = $(sourceId) ${ area ? 'AND coordinates <@ $(area)::polygon' : '' }
		), (
			SELECT min(coordinates[0]) || ',' || min(coordinates[1]) || ',' || max(coordinates[0]) || ',' || max(coordinates[1]) AS bbox
			FROM source_element
			WHERE source_id = $(sourceId) ${ area ? 'AND coordinates <@ $(area)::polygon' : '' }
		)
		FROM source
		WHERE id = $(sourceId);
	`;
	return db.one(query, { sourceId, area });
}

/**
 * Select 100 random peaks from the source.
 * @param {string} sourceId
 * @param {string} [area]
 */
module.exports.selectRndPeaks = function (sourceId, area) {
	area = common.arrayToPsqlArea(area);
	const query = `
		SELECT id, version, coordinates[0] AS lon, coordinates[1] AS lat, name
		FROM source_element
		WHERE type = 'peak'
			AND valid = TRUE
			AND source_id = $(sourceId) ${ area ? 'AND coordinates <@ $(area)::polygon' : '' }
		ORDER BY random()
		LIMIT 100;
	`;
	return db.any(query, { sourceId, area });
}

const sourceElementColumnSet = new pgp.helpers.ColumnSet(
	[ 'source_id', 'type', 'creation_time', 'coordinates', 'area_group' ],
	{ table: 'source_element' }
)

/**
 * Create a source of type 'dem_extracted'.
 * @param {Object[]} truePositivePeaks 
 * @param {Object[]} falsePositivePeaks 
 * @param {Object} areaGroups
 * @param {number[][]} patchMinMax - Minimum an maximum extension of the peaks, ex. [[15, -2], [16, -1]]
 * @param {string} description 
 * @param {string} groundTruthSourceId 
 * @param {string} demType 
 * @param {boolean} isResized 
 */
module.exports.createDemExtractedSource = async function (
	truePositivePeaks,
	falsePositivePeaks,
	areaGroups,
	patchMinMax,
	description,
	groundTruthSourceId,
	demType,
	isResized
	) {
	let now = new Date().toISOString();

	// define the ID for the source
	let sourceId = now.substring(0, 16) + ' ';
	sourceId += coordsToPatchName(patchMinMax[0]);
	if (patchMinMax[0][0] !== patchMinMax[1][0] || patchMinMax[0][1] !== patchMinMax[1][1]) {
		sourceId += '-' + coordsToPatchName(patchMinMax[1]);
	}

	await db.tx(async tr => {
		// create the source
		await createSource(tr, sourceId, description, 'dem_extracted');

		// insert false positives
		const fp = falsePositivePeaks.map(p => {
			const patchLat = Math.floor(p.estimatedCoord.lat);
			const patchLon = Math.floor(p.estimatedCoord.lon);
			const size = getDEMSize(demType, isResized, patchLat, patchLon);
			return {
				source_id: sourceId,
				type: 'peak',
				creation_time: now,
				coordinates: `(${p.estimatedCoord.lon},${p.estimatedCoord.lat})`,
				area_group: formatAreaGroup(areaGroups[p.group], size, patchLat, patchLon)
			}
		});
		const fpQuery = pgp.helpers.insert(fp, sourceElementColumnSet);
		const fpIds = await tr.any(fpQuery + ' RETURNING id');
		const fpCustomIdQuery = pgp.helpers.insert(
			falsePositivePeaks.map((peak, index) => ({ source_element_id: fpIds[index].id, type: "custom", custom_id: peak.id })),
			['source_element_id', 'type', 'custom_id'],
			'source_reference'
		);
		await tr.none(fpCustomIdQuery);

		// insert true positives
		const tp = truePositivePeaks.map(p => {
			const patchLat = Math.floor(p.estimatedCoord.lat);
			const patchLon = Math.floor(p.estimatedCoord.lon);
			const size = getDEMSize(demType, isResized, patchLat, patchLon);
			return {
				source_id: sourceId,
				type: 'peak',
				creation_time: now,
				coordinates: `(${p.estimatedCoord.lon},${p.estimatedCoord.lat})`,
				area_group: formatAreaGroup(areaGroups[p.group], size, patchLat, patchLon)
			}
		});
		const tpIds = await tr.any(pgp.helpers.insert(tp, sourceElementColumnSet) + ' RETURNING id');
		const tpCustomIdQuery = pgp.helpers.insert(
			truePositivePeaks.map((peak, index) => ({ source_element_id: tpIds[index].id, type: "custom", custom_id: peak.group })),
			['source_element_id', 'type', 'custom_id'],
			'source_reference'
		);
		await tr.none(tpCustomIdQuery);

		// insert links to ground truth
		await tr.none('CREATE TEMPORARY TABLE tp ( id INT, custom_id TEXT ) ON COMMIT DROP');
		const gtQuery = pgp.helpers.insert(
			truePositivePeaks.map((value, index) => ({ id: tpIds[index].id, custom_id: value.id2 })),
			[ 'id', 'custom_id' ],
			'tp'
		);
		await tr.none(gtQuery);
		await tr.none(`
			INSERT INTO source_element_similarity (source_element1_id, source_element1_version, source_element2_id, source_element2_version)
			SELECT tp.id, 0, se.id, se.version
			FROM source_element AS se
			JOIN source_reference AS sr ON se.id = sr.source_element_id
			JOIN tp ON sr.custom_id = tp.custom_id
			WHERE source_id = $(groundTruthSourceId)
			`, { groundTruthSourceId }
			// Query note: it is guaranteed that tp.id > se.id because the
			// ground truth must be already present in the db before
			// the insertion of the true positives
		);
	});

	return sourceId;
}

/**
 * Create a source in the database.
 * @param {Object} tr - pg-promise transaction
 * @param {string} id 
 * @param {string} description 
 * @param {string} type 
 */
function createSource(tr, id, description, type) {
	const query = `
		INSERT INTO source (id, description, general_confidence, type)
		VALUES ($(id), $(description), 0, $(type))
	`;
	return tr.any(query, { id, description, type });
}

/**
 * @typedef {Object} Point
 * @property {number} lat
 * @property {number} lon
 */

/**
 * @typedef {Object} DemSize
 * @property {number} width
 * @property {number} height
 */

/**
 * Converts grid coordinates in decimal degrees.
 * @param {number} patchLat 
 * @param {number} patchLon 
 * @param {number} row 
 * @param {number} column 
 * @param {DemSize} size
 * @returns {Point}
 */
function minutesSecondsToDecimalCoordinates(patchLat, patchLon, row, column, size)
{
	return {
		lat: patchLat + (size.height - row) / size.height,
		lon: patchLon + column / size.width
	}
}

/**
 * Computes the DEM size.
 * @param {string} demType 
 * @param {boolean} isResized 
 * @param {number} lat 
 * @param {number} lon
 * @returns {DemSize} 
 */
function getDEMSize(demType, isResized, lat, lon)
{
	const initialSize = demType === 'dem1' ?
		{ width: 3600, height: 3600 } :
		{ width: 1200, height: 1200 };
	if (isResized === true) {
		const factor = 1 / initialSize.width;
		const latDistance = calculateDistance({ lat, lon }, { lat: lat + 1 + factor, lon });
		const lonDistance = calculateDistance({ lat, lon }, { lat, lon: lon + 1 + factor });
		if (latDistance > lonDistance) {
			return { width: Math.floor(initialSize.width * lonDistance / latDistance), height: initialSize.height };
		}
		return {
			width: initialSize.width,
			height: Math.floor(initialSize.height * latDistance / lonDistance)
		};
	}
	return initialSize;
}

/**
 * Calculates the distance between two points on the earth.
 * @param {Point} firstPoint 
 * @param {Point} secondPoint
 * @returns {number} The disance in km.
 */
function calculateDistance(firstPoint, secondPoint)
{
	function toRad(value) {
		return value * Math.PI / 180;
	}
	const R = 6371;
	const firstLatRad = toRad(firstPoint.lat);
	const secondLatRad = toRad(secondPoint.lat);
	const deltaLat = toRad(secondPoint.lat - firstPoint.lat);
	const deltaLon = toRad(secondPoint.lon - firstPoint.lon);
	const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
		Math.cos(firstLatRad) * Math.cos(secondLatRad) *
		Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const d = R * c;
	return d;
}

/**
 * Converts an area group in an array of psql boxes.
 * @param {GridPoint[]} areaGroup
 * @param {DemSize} size
 * @param {number} patchLat
 * @param {number} patchLon
 * @returns {string}
 */
function formatAreaGroup(areaGroup, size, patchLat, patchLon)
{
	if (!areaGroup) return null;
	// convert the coordinates of the areas into lat,lon format
	let boxes = areaGroup.map(pt => ({
		min: minutesSecondsToDecimalCoordinates( // corner 1
			patchLat,
			patchLon,
			pt.row + 1,
			pt.column,
			size
		),
		max: minutesSecondsToDecimalCoordinates( // corner 2
			patchLat,
			patchLon,
			pt.row,
			pt.column + 1,
			size
		)
	}));
	// format boxes into psql strings
	let strBoxes = boxes.map(box => `${box.min.lon},${box.min.lat},${box.max.lon},${box.max.lat}`);
	// format all boxes in a psql array
	return `{${strBoxes.join(';')}}`;
}

/**
 * Deletes a source.
 * @param {string} sourceId
 */
module.exports.delete = function (sourceId) {
	const query = 'DELETE FROM source WHERE id = $(sourceId)';
	return db.none(query, { sourceId });
}

/**
 * Create a new source of peaks.
 * @param {string} id
 * @param {Object[]} peaks
 */
module.exports.createPeakSource = async function (sourceId,	description, peaks) {
	return db.tx(async tr => {
		let now = new Date();

		// set required fields
		peaks.forEach(peak => {
			peak.version = 0;
			peak.source_id = sourceId;
			peak.type = 'peak';
			peak.creation_time = now;
			peak.name = peak.name || null;
			peak.coordinates = `(${peak.lon},${peak.lat})`;
		});

		await createSource(tr, sourceId, description, 'public');
		let ids = await insertPeaks(tr, peaks);

		// add the custom IDs as
		let peaksReferences = [];
		peaks.forEach((peak, index) => {
			if (!peak.id) return;
			peaksReferences.push({
				source_element_id: ids[index],
				type: 'custom',
				custom_id: peak.id
			});
		});
		if (peaksReferences.length > 0) {
			await insertPeakReferences(tr, peaksReferences);
		}
	});
}

/**
 * Inserts the given peaks in the source_element table.
 * @param {Object} tr - pg-promise transaction
 * @param {Object[]} peaks
 * @returns {number[]}
 */
async function insertPeaks(tr, peaks) {
	const cs = new pgp.helpers.ColumnSet(
		[
			'version',
			'source_id',
			'type',
			'creation_time',
			'coordinates',
			'name'
		],
		{
			table: 'source_element'
		}
	);
	const query = pgp.helpers.insert(peaks, cs) + ' RETURNING id';
	let res = await tr.any(query);
	// return the IDs in an array
	return res.map(x => x.id);
}

/**
 * Inserts the given peak references in the source_reference table.
 * @param {Object} tr - pg-promise transaction
 * @param {Object[]} peakReferences
 */
async function insertPeakReferences(tr, peakReferences) {
	const cs = new pgp.helpers.ColumnSet(
		[
			'source_element_id',
			'type',
			'custom_id'
		],
		{
			table: 'source_reference'
		}
	);
	const query = pgp.helpers.insert(peakReferences, cs);
	await tr.none(query);
}

/**
 * Convert lat, lon coordinates to a string in the form 'N15W008'.
 * @param {number[][]} coords - Array of [lon, lat]
 * @returns {string}
 */
function coordsToPatchName(coords) {
	const lat = coords[1], lon = coords[0];
	return (lat < 0 ? 'S' : 'N') +
		('00' + Math.abs(Math.floor(lat))).slice(-2) +
		(lon < 0 ? 'W' : 'E') +
		('000' + Math.abs(Math.floor(lon))).slice(-3);
}

/**
 * Updates a source.
 * @param {string} sourceId
 * @param {Object} properties
 */
module.exports.update = function (sourceId, properties) {
	properties = Object.assign(
		{
			sourceId,
			id: null,
			description: null
		},
		properties
	);
	const query = `
		UPDATE source
		SET id = COALESCE($(id), id),
			description = COALESCE($(description), description)
		WHERE id = $(sourceId)
		RETURNING *
	`;
	return db.one(query, properties);
}