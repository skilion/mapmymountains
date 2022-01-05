const annotations = require('../lib/annotations');
const auth = require('../lib/auth');
const common = require('./common');
const express = require('express');
const { body, header, param } = require('express-validator/check');

const router = express.Router();
module.exports = router;

// list annotations
router.get('/:campaign_id',
	param('campaign_id').isInt({ min: 1 }),
	common.validate(),
	async (req, res, next) => {
		try {
			let list = await annotations.selectByCampaign(
				req.params.campaign_id,
			);
			res.json(list);
		} catch (err) {
			next(err);
		}
	}
);

// creates an annotation
router.post('/',
	body('source_element_id').isInt({ min: 1 }),
	body('source_element_version').isInt({ min: 0 }),
	body('campaign_id').isInt({ min: 1 }),
	body('valid').isBoolean(),
	body('name').isString().optional(),
	body('elevation').isInt({ min: 300, max: 9000 }).optional(),
	body('similar_element_id').isInt({ min: 1 }).optional(),
	body('similar_element_version').isInt({ min: 0 }).optional(),
	common.validate(),
	common.requirePermission('create_annotation'),
	async (req, res, next) => {
		try {
			// add user id of the author
			req.body.user_id = await auth.selectTokenUserId(req.get('authorization'));

			// check if the annotation already exists
			let annotationId = await annotations.selectId(
				req.body.user_id,
				req.body.campaign_id,
				req.body.source_element_id,
				req.body.source_element_version
			);

			if (!annotationId) {
				annotationId = await annotations.create(req.body);
			} else {
				await annotations.update(annotationId, req.body);
			}

			let annotation = await annotations.select(annotationId);
			res.json(annotation);
		} catch (err) {
			next(err);
		}
	}
);
