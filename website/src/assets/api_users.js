import common from './api_common';

export default {

	/**
	 * Creates a new user with the given properties.
	 * See the REST API documentation for the available properties.
	 * @param {Object} properties 
	 */
	create(properties) {
		return common.post(
			'/api/v1/users',
			properties
		);
	},

	/**
	 * Gets the properties of the given user.
	 * See the REST API documentation for the available properties.
	 * @param {string} userId 
	 */
	get(userId) {
		common.refreshToken();
		return common.get(`/api/v1/users/${userId}`);
	},

	/**
	 * Gets all the users.
	 */
	list() {
		common.refreshToken();
		return common.get('/api/v1/users/');
	},

	/**
	 * Updates the properties of the specified user.
	 * See the REST API documentation for the available properties.
	 * @param {string} userId
	 * @param {Object} properties - Properties to update.
	 */
	update(userId, properties) {
		common.refreshToken();
		return common.patch(`/api/v1/users/${userId}`, properties);
	},

	/**
	 * Sends an email with a password reset link to the specified user.
	 * @param {string} userId - User ID.
	 * @returns {Promise<boolean>}
	 */
	sendPasswordResetEmail(userId) {
		return new Promise((resolve, reject) => {
			common.refreshToken();
			userId = encodeURIComponent(userId);
			common.post(`/api/v1/users/${userId}/password_reset`)
			.then(() => {
				resolve(true);
			}).catch(err => {
				if (err.request && (err.request.status == 404)) {
					resolve(false);
				} else {
					reject(err);
				}
			});
		});
	},

	/**
	 * Reset the password of the specified user.
	 * @param {string} userId - User ID.
	 * @param {string} code - Code received by email to reset the password.
	 * @param {string} password - New password.
	 * @returns {Promise<boolean>}
	 */
	resetPassword(userId, code, password) {
		return new Promise((resolve, reject) => {
			common.refreshToken();
			password = encodeURIComponent(password);
			common.post(`/api/v1/users/${userId}/password_reset/${code}`, { password })
			.then(() => {
				resolve(true);
			}).catch(err => {
				if (err.request && (err.request.status == 403)) {
					resolve(false);
				} else {
					reject(err);
				}
			});
		});
	},

	/**
	 * Activates the the specified user.
	 * @param {string} userId - User ID.
	 * @param {string} code - Code received by email to activate the user.
	 * @returns {Promise<boolean>}
	 */
	activate(userId, code) {
		return new Promise((resolve, reject) => {
			common.refreshToken();
			common.post(`/api/v1/users/${userId}/activate/${code}`)
			.then(() => {
				resolve(true);
			}).catch(err => {
				if (err.request && (err.request.status == 403)) {
					resolve(false);
				} else {
					reject(err);
				}
			});
		});
	}

}
