import axios from 'axios';
import Cookies from 'cookies-js';
import * as config from '@/config.json';

export default {

	token: undefined,
	tokenExpirationTime: undefined,

	/**
	 * Performs an HTTP get request to the API endpoint.
	 * @param {string} path
	 */
	get(path) {
		return axios.get(
			config.api_endpoint + path,
			{ "headers": { "Authorization": this.token } }
		)
		.then(res => res.data);
	},

	/**
	 * Performs an HTTP patch request to the API endpoint.
	 * @param {string} path
	 * @param {Object} data
	 */
	patch(path, data) {
		return axios.patch(
			config.api_endpoint + path,
			data,
			{ "headers": { "Authorization": this.token } }
		)
		.then(res => res.data);
	},

	/**
	 * Performs an HTTP post request to the API endpoint.
	 * @param {string} path
	 * @param {Object} data
	 */
	post(path, data) {
		return axios.post(
			config.api_endpoint + path,
			data,
			{ "headers": { "Authorization": this.token } }
		)
		.then(res => res.data);
	},

	/**
	 * Performs an HTTP delete request to the API endpoint.
	 * @param {string} path
	 */
	delete(path) {
		return axios.delete(
			config.api_endpoint + path,
			{ "headers": { "Authorization": this.token } }
		)
		.then(res => res.data);
	},

	/**
	 * Performs an HTTP put request to the API endpoint.
	 * @param {string} path
	 * @param {Object} data
	 */
	put(path, data) {
		return axios.put(
			config.api_endpoint + path,
			data,
			{ "headers": { "Authorization": this.token } }
		)
		.then(res => res.data);
	},

	/**
	 * Refresh the token if called 30m before expiration.
	 */
	refreshToken() {
		if (!this.token || !this.tokenExpirationTime) return;
		let refreshTime = this.tokenExpirationTime.getTime() - 1000 * 60 * 30;
		if (refreshTime > new Date().getTime()) return;
		this.post('/api/v1/login/refresh')
		.then(res => {
			this.token = res.token;
			this.tokenExpirationTime = new Date(res.expiration_time);
			Cookies.set('token', res.token, { expires: res.expiration_time });
			Cookies.set('tokenExpirationTime', res.expiration_time, { expires: res.expiration_time });
			Cookies.set('user_id', Cookies.get('user_id'), { expires: res.expiration_time });
		})
		.catch(err => console.error(err));
	},

}
