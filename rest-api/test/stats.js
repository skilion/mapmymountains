const app = require('../app');
const common = require('./common');
const assert = require('assert');
const request = require('supertest');

describe('GET /api/v1/stats', () => {
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
	it('should return something', done => {
		request(app)
		.get('/api/v1/stats')
		.set('authorization', user.token)
		.expect(200)
		.expect('Content-Type', /json/)
		.expect(res => assert(res.body.top_annotators))
		.expect(res => assert(res.body.top_campaigns))
		.expect(res => assert(res.body.daily_annotations))
		.end(done);
	});
});
