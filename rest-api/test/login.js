const assert = require('assert');
const app = require('../app');
const common = require('./common');
const request = require('supertest');

describe('POST /login/refresh', () => {
	let user;
	before(async () => {
		user = await common.createTestUser();
	});

	after(done => {
		common.deleteUser(user.id, done);
	});
	
	it('should return a new token', done => {
		request(app)
		.post('/api/v1/login/refresh')
		.set('Authorization', user.token)
		.expect(200)
		.expect(res => {
			assert(res.body.token);
			assert(res.body.expiration_time);
		})
		.end(done);
	});
});