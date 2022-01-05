import common from './api_common';

export default {

	/**
	 * Send a feedback message.
	 * @param {string} text
	 */
	send(text) {
		common.refreshToken();
		return common.post('/api/v1/feedback', { text });
	}

}
