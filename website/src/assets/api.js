// MapMyMountains REST API wrapper

import common from './api_common';
import Cookies from 'cookies-js';

// sub-wrappers
import annotations from './api_annotations';
import areas from './api_areas';
import campaigns from './api_campaigns';
import feedback from './api_feedback';
import search from './api_search';
import sources from './api_sources';
import stats from './api_stats';
import users from './api_users';

export default {
	// initialized after a successful login
	loggedIn: false,
	userId: '',
	userPermissions: [],

	/**
	 * Restores login from cookies.
	 * @returns {Promise<boolean>} If false, the user is not logged in.
	 */
	init() {
		return new Promise((resolve, reject) => {
			let token = Cookies.get('token');
			let tokenExpirationTime = new Date(Cookies.get('tokenExpirationTime'));
			let userId = Cookies.get('user_id'); 
			if (token && tokenExpirationTime && userId && tokenExpirationTime > new Date()) {
				common.token = token;
				common.tokenExpirationTime = tokenExpirationTime;
				this.loggedIn = true;
				this.userId = userId;
				// get the available permissions
				this.users.get(userId)
				.then(user => {
					this.userPermissions = user.permissions;
					resolve(true);
				})
				.catch(err => {
					this.logout();
					resolve(false);
				});
			} else {
				resolve(false);
			}
		});
	},

	/**
	 * Performs a login.
	 * @param {string} userId
	 * @param {string} password
	 */
	login(userId, password) {
		return new Promise((resolve, reject) => {
			common.post(
				'/api/v1/login',
				{
					"user": userId,
					"password": password
				}
			).then(res => {
				common.token = res.token;
				common.tokenExpirationTime = new Date(res.expiration_time);

				// save the user credentials in the browser cookies
				Cookies.set('token', res.token, { expires: res.expiration_time });
				Cookies.set('tokenExpirationTime', res.expiration_time, { expires: res.expiration_time });
				Cookies.set('user_id', userId, { expires: res.expiration_time });

				return this.users.get(userId);
			}).then(user => {
				this.loggedIn = true;
				this.userId = user.id;
				this.userPermissions = user.permissions;
				resolve(true);
			}).catch (err => {
				if (err.request && (err.request.status == 400 || err.request.status == 401)) {
					resolve(false);
				} else {
					reject(err);
				}
			});
		});
	},

	/**
	 * Clears the user credentials from the browser cookies.
	 */
	logout() {
		this.loggedIn = false;
		this.userId = '';
		this.userPermissions = [];
		common.token = undefined;
		common.tokenExpirationTime = undefined;
		Cookies.expire('token');
		Cookies.expire('tokenExpirationTime');
	},

	/**
	 * Check if the user has the given permission.
	 * See the REST API documentation for the available permissions.
	 * @param {string} permission 
	 */
	hasPermission(permission) {
		return this.userPermissions.includes(permission);
	},

	// add sub-wrappers to the object
	annotations,
	areas,
	campaigns,
	feedback,
	search,
	sources,
	stats,
	users

}
