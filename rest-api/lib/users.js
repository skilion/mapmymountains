const common = require('./common');
const random = require('./random');
const hash = require('./hash');
const { db } = require('./db');

/**
 * Creates a new user
 * @param {Object} user
 * @returns {string} The activation code
 */
module.exports.create = async function(user) {
	const query = `
		INSERT INTO mmm_user (id, creation_time, email, password_hash, salt, activation_code, preferred_area)
		VALUES ($(id), NOW(), $(email), $(password_hash), $(salt), $(activation_code), $(preferred_area))
	`;
	let salt = random.randomBuffer(8);
	let password_hash = hash(user.password, salt);
	let activationCode = random.randomString(8);
	await db.none(query, {
		id: user.id,
		email: user.email,
		password_hash: password_hash,
		salt: salt,
		activation_code: activationCode,
		preferred_area: common.arrayToPsqlArea(user.preferred_area),
	});
	await setUserPermissions(user.id, ['create_annotation']);
	return activationCode;
}

/**
 * Sets the user permissions.
 * @param {string} userId
 * @param {string[]} permissions
 */
async function setUserPermissions(userId, permissions) {
	await db.none('DELETE FROM user_permission WHERE user_id = $(userId)', { userId });
	await Promise.all(permissions.map(permission =>
		db.none(
			'INSERT INTO user_permission (user_id, permission_id) VALUES ($(userId), $(permission))',
			{ userId, permission }
		)
	));
}

module.exports.setUserPermissions = setUserPermissions;

/**
 * Selects all users.
 */
module.exports.selectAll = async function() {
	const query = `
		SELECT mmm_user.id, creation_time, email, preferred_area,
			permission_id, view_tutorial, active
		FROM mmm_user
		LEFT JOIN user_permission ON mmm_user.id = user_permission.user_id
	`;
	let res = await db.any(query);
	let users = {};
	// concatenate user permissions in an array
	res.forEach(user => {
		if (users[user.id] === undefined) {
			user.preferred_area = common.psqlAreaToArray(user.preferred_area);
			user.permissions = [];
			if (user.permission_id) {
				user.permissions.push(user.permission_id);
			}
			delete user.permission_id;
			users[user.id] = user;
		} else {
			users[user.id].permissions.push(user.permission_id);
		}
	});
	return Object.values(users);
}

/**
 * Selects a single user.
 * @param {string} userId
 */
module.exports.select = async function(userId) {
	const query = `
		SELECT mmm_user.id, creation_time, email, preferred_area, permission_id,
			view_tutorial
		FROM mmm_user
		JOIN user_permission ON mmm_user.id = user_permission.user_id
		WHERE mmm_user.id = $(userId)
	`;
	let res = await db.any(query, { userId });
	if (res.length == 0) return null;
	let permissions = res.map(x => x.permission_id);
	return {
		'id': res[0].id,
		'creation_time': res[0].creation_time,
		'email': res[0].email,
		'preferred_area': common.psqlAreaToArray(res[0].preferred_area),
		'permissions': permissions,
		'view_tutorial': res[0].view_tutorial
	}
}

/**
 * Updates the properties of the specified user.
 * @param {string} userId
 * @param {Object} properties
 */
async function updateUser(userId, properties) {
	properties = Object.assign({
		id: userId,
		email: null,
		password_hash: null,
		view_tutorial: null,
		pass_recovery_code: null,
		active: null
	}, properties);
	properties.preferred_area = common.arrayToPsqlArea(properties.preferred_area);
	if (properties.password !== undefined) {
		let res = await db.one('SELECT salt FROM mmm_user WHERE id = $(userId)', { userId });
		properties.password_hash = hash(properties.password, res.salt);
	}
	if (properties.permissions !== undefined) {
		await setUserPermissions(userId, properties.permissions)
	}
	const query = `
		UPDATE mmm_user
		SET email = COALESCE($(email), email),
			password_hash = COALESCE($(password_hash), password_hash),
			preferred_area = COALESCE($(preferred_area), preferred_area),
			view_tutorial = COALESCE($(view_tutorial), view_tutorial),
			pass_recovery_code = COALESCE($(pass_recovery_code), pass_recovery_code),
			active = COALESCE($(active), active)
		WHERE id = $(id)
	`;
	return db.none(query, properties);
}

module.exports.update = updateUser;

/**
 * Deletes the specified user.
 * @param {string} userId
 */
module.exports.delete = async function(userId) {
	const query = 'DELETE FROM mmm_user WHERE id = $(userId)';
	return db.none(query, { userId });
}

/**
 * Generates a reset code for the specified user.
 * @param {string} userId
 */
module.exports.generatePasswordResetCode = async function(userId) {
	let code = random.randomString(16);
	await updateUser(userId, { pass_recovery_code: code });
	return code;
}

/**
 * Checks if the password reset code is correct and resets the user password.
 * @param {string} userId
 * @param {string} code
 * @param {string} newPassword
 * @returns {boolean}
 */
module.exports.resetPassword = async function(userId, code, newPassword) {
	if (! await checkResetCode(userId, code)) {
		return false;
	}
	await updateUser(userId, {
		password: newPassword,
		pass_recovery_code: ''
	});
	return true;
}

/**
 * Checks if the password reset code is correct.
 * @param {string} userId
 */
async function checkResetCode(userId, code) {
	const query = `
		SELECT 1
		FROM mmm_user
		WHERE id = $(userId) AND pass_recovery_code = $(code)
	`;
	let test = await db.oneOrNone(query, { userId, code });
	return test !== null;
}

/**
 * Activate the specified user.
 * @param {string} userId
 * @param {string} code
 * @returns {boolean}
 */
module.exports.activateUser = async function(userId, code) {
	if (! await checkActivationCode(userId, code)) {
		return false;
	}
	await updateUser(userId, { active: true });
	return true;
}

/**
 * Test whether the specified activation code belongs to the given user.
 * @param {string} userId
 * @param {string} code
 * @returns {boolean}
 */
async function checkActivationCode(userId, code) {
	const query = `
		SELECT 1
		FROM mmm_user
		WHERE id = $(userId) AND active = FALSE AND activation_code = $(code)
	`;
	let test = await db.oneOrNone(query, { userId, code });
	return test !== null;
}

/**
 * Test whether the specified user is active.
 * @param {string} userId
 * @returns {boolean}
 */
module.exports.isActive = async function(userId) {
	const query = `
		SELECT 1
		FROM mmm_user
		WHERE id = $(userId) AND active = TRUE
	`;
	let test = await db.oneOrNone(query, { userId });
	return test !== null;
}

/**
 * Returns the salt value for the specified user.
 * @param {string} userId
 * @returns {string|null}
 * @async
 */
module.exports.getSalt = async function (userId) {
	const query = `
		SELECT salt FROM mmm_user WHERE id = $(userId)
	`;
	return db.oneOrNone(query, { userId });
}