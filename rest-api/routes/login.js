const express = require('express');
const auth  = require('../lib/auth');
const common = require('./common');
const random = require('../lib/random');
const { header, body } = require('express-validator/check');

const router = express.Router();
module.exports = router;

// user login
router.post('/',
	body('user').matches(/^\w{5,}$/),
	body('password').isLength({ min: 5 }),
	common.validate(),
	async (req, res, next) => {
		try {
			let result = await auth.login(req.body.user, req.body.password);
			if (result) {
				res.json(result);
			} else {
				res.status(401).end();
			}
		} catch (err) {
			next(err);
		}
	}
);

// creates a new auth token
router.post('/refresh',
	header('Authorization').isAlphanumeric(),
	common.validate(),
	async (req, res, next) => {
		try {
			let userId = await auth.selectTokenUserId(req.get('Authorization'));
			if (!userId) {
				// invalid token
				return res.status(401).end();
			}
			res.json(await auth.createToken(userId));
		} catch (err) {
			next(err);
		}
	}
);