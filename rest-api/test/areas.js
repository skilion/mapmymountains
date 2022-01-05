const app = require('../app');
const assert = require('assert');
const common = require('./common');
const request = require('supertest');

describe('/api/v1/areas', () => {
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

	it('should create an area, return it, and delete it', done => {
		request(app)
		.post('/api/v1/areas/test_area')
		.set('authorization', user.token)
		.send({ boundary: [[9,45],[10,45],[10,46]] })
		.expect(201)
		.expect('Content-Type', /json/)
		.expect(res => {
			assert(res.body.id === 'test_area');
			assert(res.body.user_id === user.id);
			assert(typeof res.body.creation_time === 'string');
			assert(Array.isArray(res.body.boundary));
		})
		.then(() => {
			return request(app)
			.get('/api/v1/areas')
			.set('authorization', user.token)
			.expect(200)
			.expect('Content-Type', /json/)
			.expect(res => {
				assert(Array.isArray(res.body));
				res.body.forEach(area => {
					assert(typeof area.id === 'string');
					assert(typeof area.user_id === 'string');
					assert(typeof area.creation_time === 'string');
					assert(Array.isArray(area.boundary));
				});
			})
		})
		.then(() => {
			return request(app)
			.delete('/api/v1/areas/test_area')
			.set('authorization', user.token)
			.expect(204)
		})
		.then(() => done())
		.catch(err => done(err));
	});
});
