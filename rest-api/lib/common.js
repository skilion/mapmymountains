const _ = require('lodash');

/**
 * Format an array of peaks extracted from the DB to conform to the specifications.
 * @param {Object[]} peaks
 */
module.exports.formatPeaks = function (peaks) {
	peaks.forEach(peak => {
		// remove null properties
		for (let key in peak) {
			if (peak[key] === null) delete peak[key];
		}
		// format alternate_names
		peak.alternate_names = peak.alternate_names.map(arr => ({
			"isolanguage": arr[0],
			"alternate_name": arr[1]
		}))
	});
	return peaks;
}

/**
 * Converts a PostgreSQL polygon into a JS array.
 * @param {string} area - The area in format: "((x1,y1),...,(xN,yN))"
 */
module.exports.psqlAreaToArray = function (area) {
	if (!area) return [];
	return  _.chain(area)
		.replace(/[()]/g, '')
		.split(',').
		map(x => parseFloat(x))
		.chunk(2)
		.value();
}

/**
 * Converts a JS array to a PostgreSQL polygon.
 * @param {number[][]} area - The area in format: [[x1, y1], ..., [xN, yN]]
 */
module.exports.arrayToPsqlArea = function (area) {
	if (!area || area.length == 0) return null;
	return _.chain(area)
		.flatten()
		.join(',')
		.value();
}
