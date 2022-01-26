const auth = require('../lib/auth');
const common = require('./common');
const email = require('../lib/email');
const express = require('express');
const users = require('../lib/users');
const { body, param, header } = require('express-validator/check');

const router = express.Router();
module.exports = router;

// creates an user
router.post('/',
	body('id').matches(/^\w{5,}$/),
	body('email').isEmail(),
	body('preferred_area')
	.custom(value => Array.isArray(value) && value.every(x => Array.isArray(x) && x.every(isFinite)))
	.optional(),
	body('password').isLength({min: 5}),
	common.validate(),
	async (req, res, next) => {
		try {
			let userId = req.body.id;

			// check if the user already exists
			if (await users.select(userId) !== null) {
				return res.status(409).end();
			}

			// send email for activating the user
			let activationCode = await users.create(req.body);
			let userData = await users.select(userId);
			try {
				await email.sendActivationCodeEmail(userId, userData.email, activationCode);
			} catch (err) {
				await users.delete(userId);
				next(err);
				return;
			}

			res.json(userData);
		} catch (err) {
			next(err);
		}
	}
);

// gets all users
router.get('/',
	header('authorization').isAlphanumeric(),
	common.validate(),
	common.requirePermission('edit_users'),
	async (req, res, next) => {
		try {
			let list = await users.selectAll();
			res.json(list);
		} catch (err) {
			next(err);
		}
	}
);

// gets an user
router.get('/:id',
	header('authorization').isAlphanumeric(),
	param('id').matches(/^\w{5,}$/),
	common.validate(),
	async (req, res, next) => {
		try {
			let permissions = await auth.selectTokenPermissions(req.get('authorization'));
			let userId = await auth.selectTokenUserId(req.get('authorization'));
			if (userId == req.params.id || permissions.includes('edit_users')) {
				let user = await users.select(req.params.id);
				res.json(user);
			} else {
				res.status(403).end();
			}
		} catch (err) {
			next(err);
		}
	}
);

// updates an user
router.patch('/:id',
	header('authorization').isAlphanumeric(),
	param('id').matches(/^\w{5,}$/),
	body('email').isEmail().optional(),
	body('password').isLength({min: 5}).optional(),
	body('permissions')
	.custom(value => Array.isArray(value) && value.every(x => typeof x === 'string'))
	.optional(),
	body('preferred_area')
	.custom(value => Array.isArray(value) && value.every(x => Array.isArray(x) && x.every(isFinite)))
	.optional(),
	body('view_tutorial').isBoolean().optional(),
	common.validate(),
	async (req, res, next) => {
		try {
			let permissions = await auth.selectTokenPermissions(req.get('authorization'));
			let userId = await auth.selectTokenUserId(req.get('authorization'));
			if (userId == req.params.id || permissions.includes('edit_users')) {
				if (!permissions.includes('edit_users') && req.body.permissions != undefined) {
					// prevent user from auto-promoting themselves
					res.status(403).end();
					return;
				}
				let properties = {
					email: req.body.email,
					password: req.body.password,
					permissions: req.body.permissions,
					preferred_area: req.body.preferred_area,
					view_tutorial: req.body.view_tutorial
				}
				await users.update(req.params.id, properties);
				let user = await users.select(req.params.id);
				res.json(user);
			} else {
				res.status(403).end();
			}
		} catch (err) {
			next(err);
		}
	}
);

// deletes an user
router.delete('/:id',
	param('id').matches(/^\w{5,}$/),
	common.validate(),
	async (req, res, next) => {
		try {
			let permissions = await auth.selectTokenPermissions(req.get('authorization'));
			let userId = await auth.selectTokenUserId(req.get('authorization'));
			if (userId == req.params.id || permissions.includes('edit_users')) {
				await users.delete(req.params.id);
				res.status(204).end();
			} else {
				res.status(403).end();
			}
		} catch (err) {
			next(err);
		}
	}
);

// send an email to start the password reset procedure
router.post('/:id/password_reset',
	param('id').matches(/^\w{5,}$/),
	common.validate(),
	async (req, res, next) => {
		try {
			let userId = req.params.id;
			let userData = await users.select(userId);
			if (userData == null) {
				return res.status(404).end();
			}
			let code = await users.generatePasswordResetCode(userId);
			await email.sendPasswordResetEmail(userId, userData.email, code);
			return res.status(204).end();
		} catch (err) {
			next(err);
		}
	}
);

// reset the user password
router.post('/:id/password_reset/:code',
	param('id').matches(/^\w{5,}$/),
	param('code').isLength({min: 5}),
	body('password').isLength({min: 5}),
	common.validate(),
	async (req, res, next) => {
		try {
			let userId = req.params.id;
			let code = req.params.code;
			let newPassword = req.body.password;
			let test = await users.resetPassword(userId, code, newPassword);
			if (!test) {
				return res.status(403).end();
			}
			return res.status(204).end();
		} catch (err) {
			next(err);
		}
	}
);

// activate an user
router.post('/:id/activate/:code',
	param('id').matches(/^\w{5,}$/),
	param('code').isString(),
	common.validate(),
	async (req, res, next) => {
		try {
			let userId = req.params.id;
			let code = req.params.code;
			let test = await users.activateUser(userId, code);
			if (!test) {
				return res.status(403).end();
			}
			return res.status(204).end();
		} catch (err) {
			next(err);
		}
	}
);