const app = require('../app');
const assert = require('assert');
const common = require('./common');
const request = require('supertest');

describe('GET /api/v1/search', () => {
	let user;
	
	before(done => {
		common.createTestAdminUser((err, res) => {
			if (err) return done(err);
			user = res;
			done();
		})
	});

	after(done => {
		common.deleteUser(user.id, done);
	});

	it('should reject no parameters', done => {
		request(app)
		.get('/api/v1/search')
		.set('Authorization', user.token)
		.expect(400, done)
	});

	it('should return peaks with all properties', done => {
		request(app)
		.get('/api/v1/search?q=aiguille+source:OpenStreetMap+source:GeoNames')
		.set('Authorization', user.token)
		.expect(200)
		.expect(res => assert(
			res.body.every(x =>
				"id" in x &&
				"version" in x &&
				"source_id" in x &&
				"creation_time" in x &&
				"lon" in x &&
				"lat" in x &&
				x.alternate_names.every(y =>
					"isolanguage" in y &&
					"alternate_name" in y
				)
			)
		))
		.end(done);
	});

	it('should return one peak by ID', done => {
		request(app)
		.get('/api/v1/search?q=8688616')
		.set('Authorization', user.token)
		.expect(200)
		.expect(res => assert(res.body.length === 1))
		.expect(res => assert(res.body[0].id === 8688616))
		.end(done);
	});
});
