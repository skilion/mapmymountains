const assert = require('assert');
const common = require('./common');
const express = require('express');
const fs = require('fs');
const multer = require('multer');
const peaks = require('../lib/peaks');
const sources = require('../lib/sources');
const { body, query, param } = require('express-validator/check');

const router = express.Router();
module.exports = router;

let upload = multer({ dest: 'uploads/' });

// list sources
router.get('/', async (req, res, next) => {
	try {
		let list = await sources.selectAll();
		res.json(list);
	} catch(err) {
		next(err);
	}
});

// get source info
router.post('/:id/info',
	param('id').isString(),
	body('area')
	.custom(value => Array.isArray(value) && value.every(x => Array.isArray(x) && x.every(isFinite)))
	.optional(),
	common.validate(),
	async (req, res, next) => {
		try {
			let area;
			if (req.body.area) {
				// check if the size of the bbox of the area is less than 30000 km^2
				let lons = req.body.area.map(x => x[0]);
				let lats = req.body.area.map(x => x[1]);
				let maxLon = Math.max.apply(Math, lons), maxLat = Math.max.apply(Math, lats);
				let minLon = Math.min.apply(Math, lons), minLat = Math.min.apply(Math, lats);
				let km = latLonRectangleAreaKMeters(minLon, minLat, maxLon, maxLat);
				if (km <= 30000) {
					area = req.body.area;
				}
			}
			let info = await makeSourceInfoObject(req.params.id, area);
			res.json(info);
		} catch(err) {
			next(err);
		}
	}
);

/**
 * Collects info about a peak source.
 * @param {string} sourceId
 * @param {number[][]} area - The area in format: [[x1, y1], ..., [xN, yN]]
 */
async function makeSourceInfoObject(sourceId, area) {
	let info = await sources.selectInfo(sourceId, area);
	info.sample_peaks = area ? await sources.selectRndPeaks(sourceId, area) : [];
	return info;
}

// http://mathforum.org/library/drmath/view/63767.html
/**
 * Compute area of a bounding box on earth.
 * @param {number} lon1
 * @param {number} lat1
 * @param {number} lon2
 * @param {number} lat2
 * @returns {number}
 */
function latLonRectangleAreaKMeters(lon1, lat1, lon2, lat2) {
	const pi_180 = Math.PI / 180;
	lat1 = lat1 * pi_180;
	lat2 = lat2 * pi_180;
	lon1 = lon1 * pi_180;
	lon2 = lon2 * pi_180;
	const r2 = 6371 * 6371; // 6371 = earth radius (kilometers)
	return pi_180 * r2 * Math.abs(Math.sin(lat1) - Math.sin(lat2)) * Math.abs(lon1 - lon2);
}

// creates a new source of peaks
router.post('/',
	upload.single('peaks'),
	body('id').isString(),
	body('description').isString(),
	common.validate(),
	common.requirePermission('upload_peaks'),
	async (req, res, next) => {
		try {
			let peaksList = common.loadJSON(req.file.path);
			let id = req.body.id;
			let description = req.body.description;

			// check if the source exists already
			let sourcesList = await sources.selectAll();
			if (sourcesList.some(x => x.id === id)) {
				return res.status(409).end();
			}

			assert(Array.isArray(peaksList));

			// check if any IDs are duplicated
			let idCount = {}
			peaksList.forEach(peak => {
				if (!peak.id) return;
				assert.strictEqual(idCount[peak.id], undefined, `Peak ${peak.id} is duplicate`);
				idCount[peak.id] = 1;
			})
			
			await sources.createPeakSource(id, description, peaksList);
			let info = await makeSourceInfoObject(id, null);
			res.status(201).json(info);
		} catch (err) {
			next(err);
		} finally {
			// delete the peak list from disk
			fs.unlinkSync(req.file.path);
		}
	}
);

// creates a new source of dem extracted peaks
router.post('/dem_extracted',
	upload.fields([
		{ name: 'tp', maxCount: 1 },
		{ name: 'fp', maxCount: 1 },
		{ name: 'groups', maxCount: 100 },
	]),
	body('description').isString(),
	body('ground_truth').isString(),
	body('dem_type').isIn(['dem1', 'dem3']),
	body('is_resized').isBoolean(),
	common.validate(),
	common.requirePermission('upload_peaks'),
	async (req, res, next) => {
		try {
			let truePositivePeaks = common.loadJSON(req.files['tp'][0].path);
			let falsePositivePeaks = common.loadJSON(req.files['fp'][0].path);
			let areaGroups = {};
			let description = req.body.description;
			let groundTruthSourceId = req.body.ground_truth;
			let demType = req.body.dem_type;
			let isResized = req.body.is_resized === 'true';

			// load all area group files
			if (req.files['groups']) {
				for (let i = 0; i < req.files['groups'].length; i++) {
					let groups = common.loadJSON(req.files['groups'][i].path);
					Object.assign(areaGroups, groups);
				}
			}

			assert(Array.isArray(truePositivePeaks));
			assert(Array.isArray(falsePositivePeaks));

			// detect patch coordinates from the first peak
			let minLat = Infinity, minLon = Infinity, maxLat = -Infinity, maxLon = -Infinity;
			truePositivePeaks.concat(falsePositivePeaks).forEach(peak => {
				const lat = Math.floor(peak.estimatedCoord.lat);
				const lon = Math.floor(peak.estimatedCoord.lon);
				minLat = Math.min(minLat, lat);
				minLon = Math.min(minLon, lon);
				maxLat = Math.max(maxLat, lat);
				maxLon = Math.max(maxLon, lon);
			});
			if (!isFinite(minLat) || !isFinite(minLon)) {
				// no peaks provided
				return res.status(400).end();
			}
			assert(isFinite(maxLon));
			assert(isFinite(maxLat));

			let sourceId = await sources.createDemExtractedSource(
				truePositivePeaks,
				falsePositivePeaks,
				areaGroups,
				[[minLon, minLat], [maxLon, maxLat]],
				description,
				groundTruthSourceId,
				demType,
				isResized
			);

			let source = await sources.selectInfo(sourceId);
			res.status(201).json(source);
		} catch (err) {
			next(err);
		} finally {
			// delete the files from disk
			fs.unlinkSync(req.files['tp'][0].path);
			fs.unlinkSync(req.files['fp'][0].path);
			req.files['groups'].forEach(file => fs.unlinkSync(file.path));
		}
	}
);

// get the peaks of the source
router.get('/:id/peaks',
	param('id').isString(),
	common.validate(),
	async (req, res, next) => {
		try {
			const sourceId = req.params['id'];
			const peaksList = await peaks.selectBySourceId(sourceId);
			const similarPeaks = await peaks.selectSimilarPeakLinks(sourceId);
			const groundTruthPeakList = await peaks.selectGroundTruthPeaks(sourceId);

			// transform similarPeaks to an hashmap
			let similarPeaksLinks = {};
			similarPeaks.forEach(peak => {
				// every peak should have only one similar peak from the ground truth and viceversa
				assert.strictEqual(
					similarPeaksLinks[peak.id],
					undefined,
					`GT Peak ${peak.id} is linked to a TP peak more than once`
				);
				assert.strictEqual(
					similarPeaksLinks[peak.id2],
					undefined,
					`TP Peak ${peak.id2} is linked to a GT peak ${peak.id} ${similarPeaksLinks[peak.id2]} more than once`
				);

				similarPeaksLinks[peak.id] = peak.id2; // GT to TP
				similarPeaksLinks[peak.id2] = peak.id; // TP to GT
			});

			const result = {
				peaks: peaksList,
				ground_truth_peaks: groundTruthPeakList,
				similar_peaks_links: similarPeaksLinks,
			}
			res.json(result);
		} catch(err) {
			next(err);
		}
	}
);

// delete source
router.delete('/:id',
	param('id').isString(),
	common.validate(),
	common.requirePermission('upload_peaks'),
	async (req, res, next) => {
		try {
			const sourceId = req.params.id;
			await sources.delete(sourceId);
			res.status(204).end();
		} catch(err) {
			next(err);
		}
	}
);

// update source
router.patch('/:id',
	param('id').isString(),
	body('id').isString().optional(),
	body('description').isString().optional(),
	common.validate(),
	common.requirePermission('upload_peaks'),
	async (req, res, next) => {
		try {
			const sourceId = req.params.id;
			const newSourceId = req.body.id;

			if (newSourceId) {
				// check if the new source ID is already taken
				let sourcesList = await sources.selectAll();
				if (sourcesList.some(x => x.id === newSourceId)) {
					return res.status(409).end();
				}
			}

			let source = await sources.update(sourceId, req.body);
			res.status(200).json(source);
		} catch(err) {
			next(err);
		}
	}
);
