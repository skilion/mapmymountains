const areas = require('../lib/areas');
const auth = require('../lib/auth');
const common = require('./common');
const express = require('express');
const { body, param } = require('express-validator/check');

const router = express.Router();
module.exports = router;

// list areas
router.get('/', async (req, res, next) => {
	try {
		let list = await areas.selectAll();
		res.json(list);
	} catch(err) {
		next(err);
	}
});

// creates a new area
router.post('/:id',
	body('boundary')
	.custom(value => Array.isArray(value) && value.every(x => Array.isArray(x) && x.every(isFinite))),
	common.validate(),
	common.requirePermission('create_campaign'),
	async (req, res, next) => {
		try {
			const areaId = req.params.id;
			const boundary = req.body.boundary;
			const userId = await auth.selectTokenUserId(req.get('authorization'));
			let area = await areas.upsert(areaId, userId, boundary);
			res.status(201).json(area);
		} catch (err) {
			next(err);
		}
	}
);

// delete source
router.delete('/:id',
	param('id').isString(),
	common.validate(),
	common.requirePermission('create_campaign'),
	async (req, res, next) => {
		try {
			const areaId = req.params.id;
			let deleted = await areas.delete(areaId);
			if (!deleted) return res.status(404).end();
			res.status(204).end();
		} catch(err) {
			next(err);
		}
	}
);
