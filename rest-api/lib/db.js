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

const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbAddress = process.env.DB_ADDRESS;
const dbName = process.env.DB_NAME;

// PostgreSQL connection string
const url = 'postgres://' + dbUser + ':' + dbPass + '@' + dbAddress + '/' + dbName; 

// database instance
module.exports.db = pgp(url);
