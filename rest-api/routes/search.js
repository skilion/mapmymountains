const common = require('./common');
const express = require('express');
const peaks = require('../lib/peaks');
const { query } = require('express-validator/check');

const router = express.Router();
module.exports = router;

// list available sources of peaks
router.get('/',
	query('q')
	.isLength({min: 3}),
	common.validate(),
	common.requirePermission('search'),
	async (req, res, next) => {
		try {
			let query = req.query.q;
			// extract sources
			let sources = [];
			var sourceRegex = /(?:^|\s)source:(\w+|(?:"[^"]+"))/g;
			let match;
			while ((match = sourceRegex.exec(query)) !== null) {
				sources.push(match[1].replace('"', ''));
				// remove source from the query
				query = query.substring(0, match.index) + query.substring(sourceRegex.lastIndex);
				sourceRegex.lastIndex = match.index;
			}
			// remove whistspaces from both ends
			query = query.trim();
			// perform query
			let list;
			if (query.match(/^\d+$/)) {
				// search by ID
				list = await peaks.selectById([query]);
			} else {
				// search by name
				query = '%' + query + '%';
				list = await peaks.selectByName(query, sources);
			}
			res.json(list);
		} catch(err) {
			next(err);
		}
	}
);
