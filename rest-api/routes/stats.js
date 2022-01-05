const express = require('express');
const common = require('./common');
const stats = require('../lib/stats');
const { header } = require('express-validator/check');

const router = express.Router();
module.exports = router;

// get stats
router.get('/',
	header('authorization').isAlphanumeric(),
	common.validate(),
	common.requirePermission('view_stats'),
	async (req, res, next) => {
		try {
			let [
				top_annotators,
				top_campaigns,
				daily_annotations
			] =	await Promise.all([
				stats.selectTopAnnotators(),
				stats.selectTopCampaigns(),
				stats.selectAnnotationFreq()
			]);
			res.json({
				top_annotators,
				top_campaigns,
				daily_annotations
			});
		} catch(err) {
			next(err);
		}
	}
);
