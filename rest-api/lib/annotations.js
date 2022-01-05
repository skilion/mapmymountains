const _ = require('lodash');
const { db } = require('./db');

/**
 * Creates a new annotation.
 * @param {Object} annotation
 * @returns {number} The annotation ID.
 */
module.exports.create = async function (annotation) {
	const query = `
		INSERT INTO annotation (user_id, campaign_id, source_element_id,
			source_element_version, creation_time, valid, name, elevation,
			similar_element_id, similar_element_version)
		VALUES ($(user_id), $(campaign_id), $(source_element_id),
			$(source_element_version), NOW(), $(valid), $(name), $(elevation),
			$(similar_element_id), $(similar_element_version))
		RETURNING id
	`;

	// set optional missing fields to null
	annotation = Object.assign({
		name: null,
		elevation: null,
		similar_element_id: null,
		similar_element_version: null
	}, annotation);

	let res = await db.one(query, annotation);
	if (annotation.alternate_names) {
		await setAnnotationAlternateNames(res.id, annotation.alternate_names);
	}

	return res.id;
}

/**
 * Sets the alternate names of an annotation
 * @param {number} annotationId 
 * @param {Object[]} alternateNames 
 */
async function setAnnotationAlternateNames(annotationId, alternateNames) {
	await db.none(
		'DELETE FROM annotation_alt_name WHERE annotation_id = $(annotationId)',
		{ annotationId }
	);
	await Promise.all(alternateNames.map(alternateName => {
		if (!alternateName.isolanguage) alternateName.isolanguage = null;
		return db.none(
			'INSERT INTO annotation_alt_name (annotation_id, isolanguage, alternate_name) VALUES ($(annotationId), $(isolanguage), $(alternate_name))',
			{
				annotationId,
				isolanguage: alternateName.isolanguage,
				alternate_name: alternateName.alternate_name
			}
		)
	}));
}

/**
 * Selects an annotation.
 * @param {number} annotationId
 */
async function select(annotationId) {
	const query = `
		SELECT id, user_id, campaign_id, source_element_id,
			source_element_version, creation_time, valid, name, elevation,
			similar_element_id, similar_element_version
		FROM annotation
		WHERE id = $(annotationId)
	`;
	let annotation = await db.oneOrNone(query, { annotationId });
	if (annotation) {
		annotation.alternate_names = await db.any(
			'SELECT isolanguage, alternate_name FROM annotation_alt_name WHERE annotation_id = $(annotationId)',
			{ annotationId }
		);
	}
	return annotation;
}

module.exports.select = select;

/**
 * Selects the ID of an annotation by the author and annotated element.
 * @param {string} userId
 * @param {number} campaignId
 * @param {number} sourceElementId
 * @param {number} sourceElementVersion
 * @returns {(number|null)}
 */
module.exports.selectId = async function (userId, campaignId, sourceElementId, sourceElementVersion) {
	const query = `
		SELECT id
		FROM annotation
		WHERE user_id = $(userId) AND
			campaign_id = $(campaignId) AND
			source_element_id = $(sourceElementId) AND
			source_element_version = $(sourceElementVersion) AND
			processed_time IS NULL
	`;
	let res = await db.oneOrNone(query, { userId, campaignId, sourceElementId, sourceElementVersion });
	return res ? res.id : null;
}

/**
 * Selects the annotations of the given campaign aggregated by element ID.
 * @param {number} campaignId
 */
module.exports.selectByCampaign = async function(campaignId) {
	const query = `
		SELECT id
		FROM annotation
		WHERE campaign_id = $(campaignId) AND
			processed_time IS NULL
		ORDER BY creation_time DESC
	`;
	let res = await db.any(query, { campaignId });
	res = await Promise.all(res.map(row => select(row.id)));
	res = _.groupBy(res, row => row.source_element_id);
	return res;
}

/**
 * Selects the annotations of the user related to the specific campaign.
 * @param {number} campaignId
 * @param {string} userId
 */
module.exports.selectByCampaignAndUser = async function(campaignId, userId) {
	const query = `
		SELECT id
		FROM annotation
		WHERE campaign_id = $(campaignId) AND
			user_id = $(userId) AND
			processed_time IS NULL
	`;
	let res = await db.any(query, { campaignId, userId });
	return await Promise.all(res.map(row => select(row.id)));
}

/**
 * Updates the specifed annotation.
 * @param {number} annotationId 
 * @param {Object} annotation
 */
module.exports.update = async function (annotationId, annotation) {
	const query = `
		UPDATE annotation
		SET valid = $(valid), name = $(name), elevation = $(elevation),
			similar_element_id = $(similar_element_id),
			similar_element_version = $(similar_element_version)
		WHERE id = $(id)
	`;

	annotation = Object.assign({
		id: annotationId,
		name: null,
		elevation: null,
		similar_element_id: null,
		similar_element_version: null
	}, annotation);

	await db.none(query, annotation);
	await setAnnotationAlternateNames(annotationId, annotation.alternate_names || []);
}
