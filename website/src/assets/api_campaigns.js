import common from './api_common';

export default {

	/**
	 * Creates a new campaign.
	 * See the REST API documentation for the available parameters.
	 * @param {Object} campaign
	 */
	create(campaign) {
		common.refreshToken();
		return common.post(
			'/api/v1/campaigns',
			campaign
		);
	},

	/**
	 * Deletes a campaign.
	 * @param {number} campaignId
	 */
	delete(campaignId) {
		common.refreshToken();
		return common.delete(
			'/api/v1/campaigns/' + campaignId
		);
	},

	/**
	 * Lists the campaigns available for the user.
	 * @param {number} campaignId
	 */
	list() {
		common.refreshToken();
		return common.get(
			'/api/v1/campaigns'
		);
	},

	/**
	 * Gets the details of the specified campaign.
	 * @param {number} campaignId
	 * @param {Object} properties
	 */
	get(campaignId) {
		common.refreshToken();
		return common.get(
			`/api/v1/campaigns/${campaignId}`
		);
	},

	/**
	 * Sets the details of the specified campaign.
	 * @param {number} campaignId
	 */
	update(campaignId, properties) {
		common.refreshToken();
		return common.put(
			`/api/v1/campaigns/${campaignId}`,
			properties
		);
	}
	
}
