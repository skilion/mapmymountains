import common from './api_common';

export default {

	/**
	 * Gets the statistics.
	 */
	get() {
		common.refreshToken();
		return common.get('/api/v1/stats');
	}

}
