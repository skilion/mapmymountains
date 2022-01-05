const app = require('../app');
const assert = require('assert');
const common = require('./common');
const random = require('../lib/random');
const request = require('supertest');

describe('/api/v1/users', () => {
	it('should create an user and reject one with same name', done => {
		let userId = 'test_' + random.randomString(8);
		request(app)
		.post('/api/v1/users')
		.send({
			id: userId,
			password: 'chopsticks',
			email: 'james@gotmail.com',
			preferred_area: [
				[9.109, 45.799],
				[9.346, 45.799],
				[9.346, 45.973],
				[9.109, 45.973]
			]
		})
		.expect(200)
		.then(() => {
			return request(app)
			.post('/api/v1/users')
			.send({
				id: userId,
				password: 'chopsticks',
				email: 'james@gotmail.com',
			})
			.expect(409)
		})
		.then(() => common.deleteUser(userId, done))
		.catch(err => done(err));
	});

	it('unicode password and mail', done => {
		let userId = 'test_' + random.randomString(8);
		request(app)
		.post('/api/v1/users')
		.send({
			id: userId,
			password: 'κόσμος',
			email: 'سلام@gotmail.com',
			isolanguage: "en"
		})
		.expect(200)
		.then(() => common.deleteUser(userId, done))
		.catch(err => done(err));
	});

	it('empty id', done => {
		request(app)
		.post('/api/v1/users')
		.send({id: '', password: 'chopsticks', email: 'james@gotmail.com'})
		.expect(400, done);
	});

	it('invalid id', done => {
		request(app)
		.post('/api/v1/users')
		.send({id: 'james.smith', password: 'chopsticks', email: 'james@gotmail.com'})
		.expect(400, done);
	});

	it('invalid email', done => {
		request(app)
		.post('/api/v1/users')
		.send({id: 'james', password: 'chopsticks', email: 'abc'})
		.expect(400, done);
	});

	it('should return all users', done => {
		common.createTestAdminUser((err, user) => {
			if (err) return done(err);
			request(app)
			.get('/api/v1/users')
			.set('authorization', user.token)
			.expect(200)
			.expect(res => assert(Array.isArray(res.body)))
			.expect(res => res.body.forEach(user => assert(typeof user.id === 'string')))
			.expect(res => res.body.forEach(user => assert(typeof user.email === 'string')))
			.expect(res => res.body.forEach(user => assert(typeof user.creation_time === 'string')))
			.expect(res => res.body.forEach(user => assert(Array.isArray(user.permissions))))
			.expect(res => res.body.forEach(user => assert(Array.isArray(user.preferred_area))))
			.then(() => {
				common.deleteUser(user.id, done);
			})
			.catch(err => done(err));
		})
	});
});

describe('/api/v1/users/:id', () => {
	describe('GET', () => {
		let user;
		before(async () => {
			user = await common.createTestUser();
		});
		after(done => {
			common.deleteUser(user.id, done);
		});
		it('should return user info', done => {
			request(app)
			.get('/api/v1/users/' + user.id)
			.set('authorization', user.token)
			.expect(200)
			.expect(res => assert.strictEqual(res.body.id, user.id))
			.expect(res => assert(res.body.permissions.includes('create_annotation')))
			.expect(res => assert(typeof res.body.creation_time === 'string'))
			.expect(res => assert(typeof res.body.email === 'string'))
			.expect(res => assert(Array.isArray(res.body.preferred_area)))
			.end(done);
		});
	});

	describe('PATCH', () => {
		let user;
		before(async () => {
			user = await common.createTestUser();
		});

		after(done => {
			common.deleteUser(user.id, done);
		});

		it('should accept an empty update', done => {
			request(app)
			.patch('/api/v1/users/' + user.id)
			.set('authorization', user.token)
			.send({})
			.expect(200, done);
		});

		it('should update an user', done => {
			request(app)
			.patch('/api/v1/users/' + user.id)
			.set('authorization', user.token)
			.send({
				password: 'forks',
				group: 'expert',
				email: 'a@a.com',
				view_tutorial: true
			})
			.expect(200)
			.expect(res => {
				assert(res.body.email === 'a@a.com');
				assert(res.body.view_tutorial === true);
			})
			.end(done);
		});

		it('should not update the user permissions', done => {
			request(app)
			.patch('/api/v1/users/' + user.id)
			.set('authorization', user.token)
			.send({permissions: ['create_campaign']})
			.expect(403, done);
		});

		it('should not update an user without permission', done => {
			request(app)
			.patch('/api/v1/users/james')
			.set('authorization', user.token)
			.send({ email: 'a@a.com' })
			.expect(403, done);
		});
	});

	describe('DELETE', () => {
		let user;
		before(async () => {
			user = await common.createTestUser();
		});

		after(done => {
			request(app)
			.delete('/api/v1/users/' + user.id)
			.set('authorization', user.token)
			.expect(204, done);
		});

		it('should refuse to delete a different user', done => {
			request(app)
			.delete('/api/v1/users/james')
			.set('authorization', user.token)
			.expect(403, done);
		});
	});
});
