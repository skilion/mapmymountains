const common = require('./common');
const { db } = require('./db');

/**
 * Select peaks by IDs.
 * @param {string[]} ids 
 */
module.exports.selectById = async function (ids)
{
	let query = `
		SELECT se.id, se.version, se.source_id, se.creation_time,
			se.coordinates[0] AS lon, se.coordinates[1] AS lat, se.elevation,
			se.name, se.wikidata_id, se.wikipedia_link, se.area_group,
			sr.type AS source_type, sr.cgn_toponymic_id, sr.ct10_cod_ele,
			sr.osm_id, sr.osm_version, sr.geoname_id, sr.geoname_mtime,
			sr.custom_id,
			ARRAY(
				SELECT ARRAY[isolanguage, alternate_name]
				FROM source_element_alt_name
				WHERE source_element_id = se.id AND
					source_element_version = se.version
			) AS alternate_names
		FROM source_element AS se
		LEFT JOIN source_reference AS sr ON se.id = sr.source_element_id
		WHERE se.type = 'peak' AND
			valid = TRUE AND
			coordinates IS NOT NULL AND
			(
				id = ANY($(ids)::bigint[]) OR
				osm_id = ANY($(ids)::bigint[]) OR
				geoname_id = ANY($(ids)::bigint[])
			)
	`;
	let res = await db.any(query, { ids });
	return common.formatPeaks(res);
}

/**
 * Select peaks with similar name to the given one.
 * @param {string} name
 * @param {string[]} sources - Array of sources to filter for.
 */
module.exports.selectByName = async function (name, sources) {
	// this query performs a trivial ranking which rewards peaks with more info
	// (elevation, wikipedia link, wikidata id, alternate names
	const query = `
		SELECT se.id, se.version, se.source_id, se.creation_time,
			se.coordinates[0] AS lon, se.coordinates[1] AS lat, se.elevation,
			se.name, se.wikidata_id, se.wikipedia_link, se.area_group,
			sr.type AS source_type, sr.cgn_toponymic_id, sr.ct10_cod_ele,
			sr.osm_id, sr.osm_version, sr.geoname_id, sr.geoname_mtime,
			sr.custom_id,
			ARRAY(
				SELECT ARRAY[isolanguage, alternate_name]
				FROM source_element_alt_name
				WHERE source_element_id = se.id AND
					source_element_version = se.version
			) AS alternate_names
		FROM source_element AS se
		LEFT JOIN source_reference AS sr ON se.id = sr.source_element_id
		JOIN (
			SELECT DISTINCT se.id, se.version, (
					CASE WHEN elevation IS NULL THEN 0 ELSE 1 END +
					CASE WHEN se.wikidata_id IS NULL THEN 0 ELSE 1 END +
					CASE WHEN se.wikipedia_link IS NULL THEN 0 ELSE 1 END +
					CASE WHEN se.wikipedia_link ILIKE $(name) THEN 1 ELSE 0 END + -- wikipedia link matches the name
					COUNT(1) -- number of alternate names that match the search string
				) AS rank
			FROM source_element AS se
			LEFT JOIN source_element_alt_name sean ON se.id = sean.source_element_id AND se.version = sean.source_element_version
			WHERE se.type = 'peak' AND
				valid = TRUE AND
				${sources.length ? 'source_id IN ($(sources:csv)) AND' : ''}
				coordinates IS NOT NULL AND
				(
					se.name ILIKE $(name) OR
					sean.alternate_name ILIKE $(name)
				)
			GROUP BY se.id, se.version
			ORDER BY rank DESC
			LIMIT 100
		) AS r ON se.id = r.id AND se.version = r.version
	`;
	let res = await db.any(query, { sources, name });
	return common.formatPeaks(res);
}

/**
 * Returns at most 10.000 peaks from the specified source.
 * The limit is set to prevent overload of the DB. If the source is so big
 * other methods should be considered.
 * @param {string} sourceId
 */
module.exports.selectBySourceId = async function (sourceId) {
	const query = `
		SELECT se.id, se.version, se.source_id, se.creation_time,
			se.coordinates[0] AS lon, se.coordinates[1] AS lat, se.elevation,
			se.name, se.wikidata_id, se.wikipedia_link, se.area_group,
			sr.type AS source_type, sr.cgn_toponymic_id, sr.ct10_cod_ele,
			sr.osm_id, sr.osm_version, sr.geoname_id, sr.geoname_mtime,
			sr.custom_id,
			ARRAY(
				SELECT ARRAY[isolanguage, alternate_name]
				FROM source_element_alt_name
				WHERE source_element_id = se.id AND
					source_element_version = se.version
			) AS alternate_names
		FROM source_element AS se
		LEFT JOIN source_reference AS sr ON se.id = sr.source_element_id
		WHERE se.source_id = $(sourceId)
		LIMIT 10000
	`;
	let res = await db.any(query, { sourceId });
	return common.formatPeaks(res);
}

/**
 * Returns at most 10.000 IDs of similar peaks linked to the specified source.
 * The limit is set to prevent overload of the DB. If the source is so big
 * other methods should be considered.
 * @param {string} sourceId
 */
module.exports.selectSimilarPeakLinks = async function (sourceId) {
	const query = `
		SELECT se.id, se2.id AS id2
		FROM source_element AS se
		JOIN source_element_similarity AS ses ON se.id = ses.source_element2_id AND se.version = ses.source_element2_version
		JOIN source_element AS se2 ON se2.id = ses.source_element1_id AND se2.version = ses.source_element1_version
		WHERE se2.source_id = $(sourceId)
		LIMIT 10000
	`;
	return await db.any(query, { sourceId });
}

/**
 * Returns at most 10.000 peaks from the sources of the peaks linked as similar
 * to the specified source. The peaks are taken only from the patch where the
 * specified source is contained.
 * The 10.000 limit is set to prevent overload of the DB. If the source is so
 * big other methods should be considered.
 * @param {string} sourceId
 */
module.exports.selectGroundTruthPeaks = async function (sourceId) {
	const query = `
		SELECT se.id, se.version, se.source_id, se.creation_time,
			se.coordinates[0] AS lon, se.coordinates[1] AS lat, se.elevation,
			se.name, se.wikidata_id, se.wikipedia_link, se.area_group,
			sr.type AS source_type, sr.cgn_toponymic_id, sr.ct10_cod_ele,
			sr.osm_id, sr.osm_version, sr.geoname_id, sr.geoname_mtime,
			sr.custom_id,
			ARRAY(
				SELECT ARRAY[isolanguage, alternate_name]
				FROM source_element_alt_name
				WHERE source_element_id = se.id AND
					source_element_version = se.version
			) AS alternate_names
		FROM source_element AS se
		LEFT JOIN source_reference AS sr ON se.id = sr.source_element_id
		WHERE se.source_id IN (
				SELECT DISTINCT se3.source_id
				FROM source_element AS se2
				JOIN source_element_similarity AS ses ON se2.id = ses.source_element1_id AND se2.version = ses.source_element1_version
				JOIN source_element AS se3 ON se3.id = ses.source_element2_id AND se3.version = ses.source_element2_version
				WHERE se2.source_id = $(sourceId)
			) AND (floor(se.coordinates[0]), floor(se.coordinates[1])) IN (
				SELECT DISTINCT floor(se4.coordinates[0]), floor(se4.coordinates[1])
				FROM source_element AS se4
				WHERE se4.source_id = $(sourceId)
			)
		LIMIT 10000
	`;
	let res = await db.any(query, { sourceId });
	return common.formatPeaks(res);
}
