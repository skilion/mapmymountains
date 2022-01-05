import common from './api_common';

export default {

	/**
	 * Lists the saved areas.
	 */
	list() {
		common.refreshToken();
		return common.get('/api/v1/areas');
	},

	/**
	 * Creates (or overwrites) an area.
	 * @param {string} areaId
	 * @param {number[][]} boundary - Area in the format [[lon1, lat1], ..., [lonN, latN]]
	 */
	create(areaId, boundary) {
		common.refreshToken();
		areaId = encodeURIComponent(areaId);
		return common.post(`/api/v1/areas/${areaId}`, { boundary });
	},

	/**
	 * Delets an area.
	 * @param {string} areaId
	 */
	delete(areaId) {
		common.refreshToken();
		areaId = encodeURIComponent(areaId);
		return common.delete(`/api/v1/areas/${areaId}`);
	}

}
