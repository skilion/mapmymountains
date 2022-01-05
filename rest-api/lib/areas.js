const common = require('./common');
const { db } = require('./db');

/**
 * Selects all areas.
 */
module.exports.selectAll = async function () {
	const query = `
		SELECT id, user_id, creation_time, boundary
		FROM area
		ORDER BY id;
	`;
	let res = await db.any(query);
	res.forEach(area => area.boundary = common.psqlAreaToArray(area.boundary));
	return res;
}

/**
 * Inserts a new area.
 * @param {string} areaId 
 * @param {string} userId 
 * @param {number[][]} boundary 
 */
module.exports.upsert = async function (areaId, userId, boundary) {
	boundary = common.arrayToPsqlArea(boundary);
	let res = await db.one(`
			INSERT INTO area (id, user_id, creation_time, boundary)
			VALUES ($(areaId), $(userId), NOW(), $(boundary))
			ON CONFLICT (id)
			DO UPDATE SET user_id = $(userId), creation_time = NOW(), boundary = $(boundary)
			RETURNING *
		`,
		{ areaId, userId, boundary }
	);
	res.boundary = common.psqlAreaToArray(res.boundary);
	return res;
}

/**
 * Deletes an area.
 * @param {string} areaId
 * @returns {boolean} True if something was deleted.
 */
module.exports.delete = function (areaId) {
	const query = 'DELETE FROM area WHERE id = $(areaId) RETURNING 1';
	let res = db.oneOrNone(query, { areaId })
	return res != null;
}
