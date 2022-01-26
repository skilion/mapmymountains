var _ = require('lodash');
const annotations = require('../lib/annotations');
const auth = require('../lib/auth');
const common = require('./common');
const express = require('express');
const campaigns = require('../lib/campaigns');
const { body, header, param } = require('express-validator/check');

const router = express.Router();
module.exports = router;

// lists campaigns
router.get('/',
	header('authorization').isAlphanumeric(),
	common.validate(),
	async (req, res, next) => {
		try {
			let userId = await auth.selectTokenUserId(req.get('authorization'));
			if (!userId) return res.status(401).end();
			let permissions = await auth.selectTokenPermissions(req.get('authorization'));
			let list;
			if (permissions.includes('create_campaign')) {
				list = await campaigns.selectAll(userId);
			} else {
				list = await campaigns.selectAllActive(userId);
			}
			res.json(list);
		} catch (err) {
			next(err);
		}
	}
);

// gets a campaign
router.get('/:id',
	header('authorization').isAlphanumeric(),
	param('id').isInt(),
	async (req, res, next) => {
		try {
			let userId = await auth.selectTokenUserId(req.get('authorization'));
			if (!userId) return res.status(401).end();
			let campaign = await campaigns.select(req.params.id);
			let peaks = await campaigns.selectPeaks(req.params.id);
			let refPeaks = await campaigns.selectRefPeaks(req.params.id);
			let annotationList = await annotations.selectByCampaignAndUser(req.params.id, userId);

			// merge peaks and annotations
			annotationList = _.keyBy(annotationList, 'source_element_id');
			_.each(peaks, peak => {
				if (peak.id in annotationList) {
					peak.annotation = annotationList[peak.id];
				}
			});

			// add campaign peaks
			campaign.peaks = peaks;
			campaign.ref_peaks = refPeaks;

			res.json(campaign);
		} catch (err) {
			next(err);
		}
	}
);

// creates a new campaign
router.post('/',
	body('name').isString(),
	body('description').isString(),
	body('start_time').isISO8601(),
	body('end_time').isISO8601(),
	body('boundary')
	.custom(value => Array.isArray(value) && value.every(x => Array.isArray(x) && x.every(isFinite))),
	body('source_id').isString(),
	body('ref_source_id').isString().optional(),
	common.validate(),
	common.requirePermission('create_campaign'),
	async (req, res, next) => {
		return res.status(202).end();
		try {
			req.body.creation_time = new Date();
			req.body.user_id = await auth.selectTokenUserId(req.get('authorization'));
			let campaign = await campaigns.insert(req.body);
			res.json(campaign);
		} catch (err) {
			next(err);
		}
	}
);

// deletes a campaign
router.delete('/:id',
	param('id').isString(),
	common.validate(),
	common.requirePermission('create_campaign'),
	async (req, res, next) => {
		return res.status(202).end();
		try {
			await campaigns.delete(req.params.id);
			res.status(204).end();
		} catch (err) {
			next(err);
		}
	}
);

// replace a campaign
router.put('/:id',
	body('name').isString(),
	body('description').isString(),
	body('start_time').isISO8601(),
	body('end_time').isISO8601(),
	body('boundary')
	.custom(value => Array.isArray(value) && value.every(x => Array.isArray(x) && x.every(isFinite))),
	body('source_id').isString(),
	body('ref_source_id').isString().optional(),
	common.validate(),
	common.requirePermission('create_campaign'),
	async (req, res, next) => {
		return res.status(202).end();
		try {
			req.body.id = req.params.id;
			let campaign = await campaigns.replace(req.body);
			res.json(campaign);
		} catch (err) {
			next(err);
		}
	}
);