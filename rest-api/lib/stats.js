const { db } = require('./db');

module.exports.selectTopAnnotators = function ()
{
	const query = `
		SELECT user_id, count(*)::int AS num_annotations
		FROM annotation
		GROUP BY user_id
		ORDER BY num_annotations DESC
		LIMIT 10
	`;
	return db.any(query);
}

module.exports.selectAnnotationFreq = function ()
{
	const query = `
		SELECT date::date, count(annotation.creation_time)::int AS num_annotations
		FROM generate_series(NOW() - interval '1 month', NOW(), '1 day'::interval) date LEFT JOIN annotation
		ON annotation.creation_time::date = date::date
		GROUP BY date
		ORDER BY date ASC
	`;
	return db.any(query);
}

module.exports.selectTopCampaigns = function ()
{
	const query = `
		SELECT campaign_id, campaign.name, count(*)::int AS num_annotations
		FROM annotation
		JOIN campaign ON campaign.id = annotation.campaign_id
		WHERE campaign_id IS NOT NULL
		GROUP BY campaign_id, campaign.name
		ORDER BY num_annotations DESC
		LIMIT 10
	`;
	return db.any(query);
}
