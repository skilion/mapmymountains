import common from './api_common';

export default {

	/**
	 * Lists the annotations of a campaign.
	 * @param {number} campaignId
	 */
	list(campaignId) {
		common.refreshToken();
		return common.get(
			`/api/v1/annotations/${campaignId}`
		);
	},
	
	/**
	 * Creates a new annotation.
	 * See the REST API documentation for the available parameters.
	 * @param {Object} annotation
	 */
	create(annotation) {
		common.refreshToken();
		return common.post(
			'/api/v1/annotations',
			annotation
		);
	}

}
