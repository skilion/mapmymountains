const common = require('./common');
const { db } = require('./db');

/**
 * Returns the details of a campaign.
 * @param {number} campaignId
 */
module.exports.select = async function (campaignId) {
	const query = `
		SELECT id, name, description, user_id, creation_time, start_time,
			end_time, source_id, ref_source_id, boundary
		FROM campaign
		WHERE id = $(campaignId)
	`;
	let res = await db.oneOrNone(query, { campaignId });
	if (res) {
		res.boundary = common.psqlAreaToArray(res.boundary);
	}
	return res;
}

/**
 * Returns an array of all campaigns and their progress for a specific user.
 * @param {string} userId
 */
module.exports.selectAll = async function (userId) {
	const query = `
		SELECT c1.id, c1.name, c1.description, c1.user_id, c1.creation_time,
			c1.start_time, c1.end_time, c1.source_id, c1.ref_source_id,
			(SELECT  COUNT(a.id)::integer
				FROM annotation AS a
				JOIN campaign AS c2 ON a.campaign_id = c2.id
				WHERE a.user_id = $(userId) AND
					a.processed_time IS NULL AND
					c2.id = c1.id) AS num_annotations,
			(SELECT COUNT(se.source_id)::integer
				FROM source_element AS se
				JOIN campaign AS c3
				ON se.source_id = c3.source_id AND se.coordinates <@ c3.boundary
				WHERE se.type = 'peak' AND
					se.valid = TRUE AND
					se.coordinates IS NOT NULL AND
					c3.id = c1.id) AS num_peaks
		FROM campaign AS c1
	`;
	let res = await db.any(query, { userId });
	res.forEach(x => x.boundary = common.psqlAreaToArray(x.boundary));
	return res;
}

/**
 * Returns an array of all active campaigns and their progress for a specific user.
 * @param {string} userId
 */
module.exports.selectAllActive = function (userId) {
	const query = `
		SELECT c1.id, c1.name, c1.description, c1.user_id, c1.creation_time,
			c1.start_time, c1.end_time, c1.source_id, c1.ref_source_id,
			(SELECT COUNT(a.id)::integer
				FROM annotation AS a
				JOIN campaign AS c2 ON a.campaign_id = c2.id
				WHERE a.user_id = $(userId) AND
					a.processed_time IS NULL AND
					c2.id = c1.id) AS num_annotations,
			(SELECT COUNT(se.source_id)::integer
				FROM source_element AS se
				JOIN campaign AS c3
				ON se.source_id = c3.source_id AND se.coordinates <@ c3.boundary
				WHERE se.type = 'peak' AND
					se.valid = TRUE AND
					se.coordinates IS NOT NULL AND
					c3.id = c1.id) AS num_peaks
		FROM campaign AS c1
		WHERE end_time > NOW()
	`;
	return db.any(query,  { userId });
}

/**
 * Creates a campaign. Returns its properties.
 * @param {Object} properties - The properties of the campaign.
 * @returns {Object}
 */
module.exports.insert = async function (properties) {
	properties.boundary = common.arrayToPsqlArea(properties.boundary);
	if (properties.ref_source_id === undefined) properties.ref_source_id = null;
	const query = `
		INSERT INTO campaign (name, description, user_id, creation_time,
			start_time, end_time, boundary, source_id, ref_source_id)
		VALUES ($(name), $(description), $(user_id), NOW(), $(start_time),
			$(end_time), $(boundary), $(source_id), $(ref_source_id))
		RETURNING *
	`;
	let res = await db.one(query, properties);
	res.boundary = common.psqlAreaToArray(res.boundary);
	return res;
}

/**
 * Returns the peaks associated to a campaign
 * @param {number} campaignId
 */
module.exports.selectPeaks = async function (campaignId) {
	const query = `
		SELECT se.id, se.version, coordinates[0] AS lon, coordinates[1] AS lat,
			se.source_id, se.elevation, se.name, se.wikidata_id, se.wikipedia_link,
			ARRAY(
				SELECT ARRAY[isolanguage, alternate_name]
				FROM source_element_alt_name
				WHERE source_element_id = se.id AND
					source_element_version = se.version
			) AS alternate_names
		FROM source_element AS se
		JOIN campaign AS c ON se.source_id = c.source_id AND se.coordinates <@ c.boundary
		WHERE se.type = 'peak' AND
			se.valid = TRUE AND
			se.coordinates IS NOT NULL AND
			c.id = $(campaignId)
	`;
	let res = await db.any(query, { campaignId });
	common.formatPeaks(res);
	return res;
}

/**
 * Returns the reference peaks associated to a campaign
 * @param {number} campaignId
 */
module.exports.selectRefPeaks = async function (campaignId) {
	const query = `
		SELECT se.id, se.version, coordinates[0] AS lon, coordinates[1] AS lat,
			se.source_id, se.elevation, se.name, se.wikidata_id, se.wikipedia_link,
			ARRAY(
				SELECT ARRAY[isolanguage, alternate_name]
				FROM source_element_alt_name
				WHERE source_element_id = se.id AND
					source_element_version = se.version
			) AS alternate_names
		FROM source_element AS se
		JOIN campaign AS c ON se.source_id = c.ref_source_id AND se.coordinates <@ c.boundary
		WHERE se.type = 'peak' AND
			se.valid = TRUE AND
			se.coordinates IS NOT NULL AND
			c.id = $(campaignId)
	`;
	let res = await db.any(query, { campaignId });
	common.formatPeaks(res);
	return res;
}

/**
 * Deletes a campaign.
 * @param {number} campaignId
 */
module.exports.delete = async function (campaignId) {
	const query = 'DELETE FROM campaign WHERE id = $(campaignId)';
	return db.none(query, { campaignId });
}

/**
 * Updates a campaign. Returns its properties.
 * @param {Object} properties - The properties of the campaign.
 * @returns {Object}
 */
module.exports.replace = async function (properties) {
	properties.boundary = common.arrayToPsqlArea(properties.boundary);
	if (properties.ref_source_id === undefined) properties.ref_source_id = null;
	const query = `
		UPDATE campaign
		SET name = $(name),
			description = $(description),
			start_time = $(start_time),
			end_time = $(end_time),
			boundary = $(boundary),
			source_id = $(source_id),
			ref_source_id = $(ref_source_id)
		WHERE id = $(id)
		RETURNING *
	`;
	let res = await db.one(query, properties);
	res.boundary = common.psqlAreaToArray(res.boundary);
	return res;
}