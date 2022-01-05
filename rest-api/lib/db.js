const pgPromise = require('pg-promise');

const options = {
	error(err, e) {
		console.log('QUERY:', e.query);
        if (e.params) {
            console.log('PARAMS:', e.params);
        }
	}
};

const pgp = pgPromise(options)
module.exports.pgp = pgp;

// fix parsing timestamps without time zone
require('pg').types.setTypeParser(1114, stringValue => {
	return new Date(stringValue + '+0000');
});

// get config vars from environment
const config = require('../config');
const dbUser = process.env.DB_USER || config.db_user;
const dbPass = process.env.DB_PASS || config.db_pass;
const dbAddress = process.env.DB_ADDRESS || config.db_address;
const dbName = process.env.DB_NAME || config.db_name;

// PostgreSQL connection string
const url = 'postgres://' + dbUser + ':' + dbPass + '@' + dbAddress + '/' + dbName; 

// database instance
module.exports.db = pgp(url);
