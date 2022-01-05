import common from './api_common';

export default {

	/**
	 * Returns peaks that corresponds to the query.
	 * @param {string} query 
	 */
	get(query) {
		common.refreshToken();
		query = encodeURIComponent(query);
		let path = `/api/v1/search?q=${query}`;
		return common.get(path);
	}

}
