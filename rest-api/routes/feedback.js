const common = require('./common');
const email = require('../lib/email');
const express = require('express');
const { body, param, header } = require('express-validator/check');

const router = express.Router();
module.exports = router;

// send a feedback text
router.post('/',
	body('text').isString(),
	common.validate(),
	async (req, res, next) => {
		return res.status(202).end();
		try {
			let text = req.body.text;
			await email.sendFeedback(text);
			res.status(204).end();
		} catch (err) {
			next(err);
		}
	}
);
