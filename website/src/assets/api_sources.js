import common from './api_common';

export default {

	/**
	 * Lists the sources.
	 */
	list() {
		common.refreshToken();
		return common.get('/api/v1/sources');
	},

	/**
	 * Gets the details of a source.
	 * @param {string} sourceId
	 * @param {number[][]} [area] - An area to limit the query, format is [[lon1, lat1], ..., [lonN, latN]]
	 */
	getInfo(sourceId, area) {
		common.refreshToken();
		sourceId = encodeURIComponent(sourceId);
		return common.post(
			`/api/v1/sources/${sourceId}/info`,
			{ area }
		);
	},

	/**
	 * Creates a new peak source of peaks extracted from the DEM.
	 * @param {File} tpFile 
	 * @param {File} fpFile
	 * @param {File[]} [groupsFiles]
	 * @param {string} description
	 * @param {string} groundTruth
	 * @param {string} demType
	 * @param {boolean} isResized
	 */
	createDemExtracted(tpFile, fpFile, groupsFiles, description, groundTruth, demType, isResized) {
		common.refreshToken();
		const formData = new FormData();
		formData.append("tp", tpFile);
		formData.append("fp", fpFile);
		groupsFiles.forEach(file => formData.append("groups", file));
		formData.append("description", description);
		formData.append("ground_truth", groundTruth);
		formData.append("dem_type", demType);
		formData.append("is_resized", isResized.toString());
		return common.post(
			'/api/v1/sources/dem_extracted',
			formData
		);
	},

	/**
	 * Creates a new source of peaks.
	 * @param {string} sourceId
	 * @param {string} description
	 * @param {File} file 
	 */
	create(sourceId, description, file) {
		common.refreshToken();
		const formData = new FormData();
		formData.append("id", sourceId);
		formData.append("description", description);
		formData.append("peaks", file, file.name);
		return common.post(
			'/api/v1/sources',
			formData
		);
	},

	/**
	 * Deletes a source.
	 * @param {string} sourceId
	 */
	delete(sourceId) {
		common.refreshToken();
		sourceId = encodeURIComponent(sourceId);
		return common.delete(`/api/v1/sources/${sourceId}`);
	},

	/**
	 * Gets the peaks of a source.
	 * @param {string} sourceId
	 */
	getPeaks(sourceId) {
		common.refreshToken();
		sourceId = encodeURIComponent(sourceId);
		return common.get(`/api/v1/sources/${sourceId}/peaks`)
		.then(data => {
			// convert area groups to array of boxes:
			// [ [[minX, minY],[maxX, maxY]], ... ]
			data.peaks.forEach(peak => {
				if (!peak.area_group) return;
				// remove curly braces
				let area = peak.area_group.substring(1, peak.area_group.length - 1);
				let boxes = area.split(';').filter(x => x).map(box => {
					// box is in format "(9.60844209941683,46.4979172452097),(9.60816439877812,46.497639544571)"
					let match = box.match(/\(([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)\),\(([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)\)/);
					return [
						[parseFloat(match[1]), parseFloat(match[2])],
						[parseFloat(match[3]), parseFloat(match[4])],
					];
				});
				peak.area_group = boxes;
			});
			return data;
		});
	},

	/**
	 * Updates a source.
	 * @param {string} sourceId
	 * @param {Object} properties
	 */
	update(sourceId, properties) {
		common.refreshToken();
		sourceId = encodeURIComponent(sourceId);
		return common.patch(`/api/v1/sources/${sourceId}`, properties);
	}

}
