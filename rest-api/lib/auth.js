const config = require('../config');
const hash = require('./hash');
const random = require('./random');
const users = require('./users');
const { db } = require('./db');

const testPassQuery = `
	SELECT 1 AS res
	FROM mmm_user
	WHERE id = $(id) AND password_hash = $(password_hash)
`;
const insertToken = `
	INSERT INTO access_token (mmm_user_id, creation_time, token)
	VALUES ($(id), $(creation_time), $(token))
`;

/**
 * Perform login.
 * If the authentication goes well, returns
 * { token: string, expiration_time: Date }
 * else returns null
 * @param {string} userId
 * @param {password} user
 */
module.exports.login = async function (userId, password) {
	/*if (! await users.isActive(userId)) {
		return null;
	}*/
	let salt = await users.getSalt(userId);
	if (!salt) {
		return null;
	}
	let password_hash = hash(password, salt.salt);
	let test = await db.oneOrNone(testPassQuery, {id: userId, password_hash: password_hash});
	if (!test) {
		return null;
	}
	let now = Date.now();
	let creation_time = new Date(now);
	let token = random.randomString(30);
	await db.none(insertToken, {id: userId, creation_time: creation_time, token: token});
	return {
		token: token,
		expiration_time: new Date(now + config.token_duration_sec * 1000)
	}
}

/**
 * Returns the permission of the user associated to the token
 * @param {string} token 
 * @returns {string[]}
 */
module.exports.selectTokenPermissions = async function (token)
{
	const query = `
		SELECT permission_id
		FROM user_permission
		INNER JOIN access_token AS c ON user_permission.user_id = c.mmm_user_id
		WHERE c.token = $(token) AND c.creation_time >= $(time)
	`;
	let time = new Date(Date.now() - config.token_duration_sec * 1000);
	let res = await db.any(query, { token, time });
	return res.map(x => x.permission_id);
}

/**
 * Returns the user ID associated to the token or null.
 * @param {string} token
 */
module.exports.selectTokenUserId = async function (token) {
	const query = `
		SELECT mmm_user_id
		FROM access_token
		WHERE token = $(token) AND creation_time >= $(time)
	`;
	let time = new Date(Date.now() - config.token_duration_sec * 1000);
	let res = await db.oneOrNone(query, { token, time});
	return res ? res.mmm_user_id : null;
}

/**
 * Creates a new token for the specified user
 * @param {string} userId
 * @returns {Promise<{ token: string, expiration_time: Date }>}
 */
module.exports.createToken = async function (userId) {
	let creation_time = new Date();
	let token = random.randomString(30);
	await db.none(insertToken, { id: userId, creation_time, token });
	return {
		token,
		expiration_time: new Date(creation_time.getTime() + config.token_duration_sec * 1000)
	}
}
