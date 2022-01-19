const auth = require('../lib/auth');
const fs = require('fs');
const { validationResult } = require('express-validator/check');

/**
 * Validates the request parameters with express-validator
 */
module.exports.validate = function () {
	return async (req, res, next) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({errors: errors.mapped()});
			}
		} catch (err) {
			next(err);
		}
		next();
	}
}

/**
 * Checks if the given permission is associated to the user token.
 * Returns HTTP 401 if the authentication token wasn't provided or it is expired.
 * Returns HTTP 403 if the user does not have the specified permission.
 * @param {string} permission
 * @returns {function} Express middleware function.
 */
module.exports.requirePermission = function (permission) {
	return async (req, res, next) => {
		try {
			let token = req.get('Authorization');
			if (typeof token !== 'string') {
				return res.status(401).end();
			}
			const permissions = await auth.selectTokenPermissions(token);
			if (permissions.length == 0) {
				return res.status(401).end();
			}
			if (!permissions.includes(permission)) {
				return res.status(403).end();
			}
		} catch (err) {
			next(err);
		}
		next();
	}
}

/**
 * Loads a JSON/JSONL file.
 * @param {string} filepath
 * @returns {Object}
 */
module.exports.loadJSON = function (filepath) {
	let data = fs.readFileSync(filepath, { encoding: 'utf8' });
	let lines = data
		.split('\n')
		.map(line => line.trim());
	let isJSONL = lines.every(line => !line || (line.startsWith('{') && line.endsWith('}')));
	if (isJSONL) {
		return lines.map(x => JSON.parse(x));
	}
    return JSON.parse(data);        
}
