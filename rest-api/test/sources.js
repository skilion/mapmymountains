const app = require('../app');
const assert = require('assert');
const common = require('./common');
const request = require('supertest');

describe('GET /api/v1/sources', () => {
	it('should return some sources', done => {
		request(app)
		.get('/api/v1/sources')
		.expect(200)
		.expect('Content-Type', /json/)
		.expect(res => assert(res.body.length > 0))
		.expect(res => res.body.every(e => assert(e.id && e.description)))
		.end(done);
	});

	it('should return test', done => {
		request(app)
		.get('/api/v1/sources')
		.expect(res => assert(res.body.some(e => e.id == 'test')))
		.end(done);
	});
});

describe('POST /api/v1/sources/:id/info', () => {
	it('should returns source info', done => {
		request(app)
		.post('/api/v1/sources/test/info')
		.expect(200)
		.expect('Content-Type', /json/)
		.expect(res => assert(res.body.num_peaks > 1000))
		.expect(res => assert(res.body.bbox))
		.expect(res => assert(Array.isArray(res.body.sample_peaks)))
		.expect(res => assert(res.body.sample_peaks.length === 0))
		.end(done);
	});

	it('returns source info with area filter', done => {
		request(app)
		.post('/api/v1/sources/test/info')
		.send({ area: [[9,45],[10,45],[10,46],[9,46]] })
		.expect(200)
		.expect('Content-Type', /json/)
		.expect(res => assert(res.body.num_peaks > 100))
		.expect(res => assert(res.body.bbox.split(',')[0] > 0))
		.expect(res => assert(Array.isArray(res.body.sample_peaks)))
		.expect(res => assert(res.body.sample_peaks.length > 10))
		.end(done);
	});
});

describe('POST /api/v1/sources/dem_extracted', () => {
	let user;
	before(done => {
		common.createTestAdminUser((err, res) => {
			if (err) return done(err);
			user = res;
			common.deleteSource('TEST-GT')
			.then(done);
		})
	});
	after(done => {
		common.deleteUser(user.id, done);
	});
	it('should create a new DEM source', done => {
		let sourceId;
		request(app)
		.post('/api/v1/sources')
		.set('authorization', user.token)
		.field('id', 'TEST-GT')
		.field('description', 'test')
		.attach('peaks', 'test/gt.json')
		.expect(201)
		.then(() => {
			return request(app)
				.post('/api/v1/sources/dem_extracted')
				.set('authorization', user.token)
				.field('description', 'test')
				.field('ground_truth', 'TEST-GT')
				.field('dem_type', 'dem1')
				.field('is_resized', 'false')
				.attach('tp', 'test/tp.json')
				.attach('fp', 'test/fp.json')
				.attach('groups', 'test/groups1.json')
				.attach('groups', 'test/groups2.json')
				.attach('groups', 'test/groups3.json')
				.expect(201);
		})
		.then(res => {
			sourceId = res.body.id;
			return request(app)
				.get(`/api/v1/sources/${sourceId}/peaks`)
				.expect(200)
				.expect(res => assert(res.body.peaks.length > 100))
				.expect(res => assert(res.body.ground_truth_peaks.length > 100))
				.expect(res => assert(Object.keys(res.body.similar_peaks_links).length > 100))
		})
		.then(() => {
			return common.deleteSource('TEST-GT');
		})
		.then(() => {
			return common.deleteSource(sourceId);
		})
		.then(() => done())
		.catch(err => done(err));
	});
});

describe('POST /api/v1/sources', () => {
	let user;
	before(done => {
		common.createTestAdminUser((err, res) => {
			if (err) return done(err);
			user = res;
			common.deleteSource('TEST')
			.then(done);
		})
	});
	after(done => {
		common.deleteUser(user.id, done);
	});
	it('should create a new source and edit it', done => {
		request(app)
		.post('/api/v1/sources')
		.set('authorization', user.token)
		.field('id', 'TEST')
		.field('description', 'test')
		.attach('peaks', 'test/gt.json')
		.expect(201)
		.expect('Content-Type', /json/)
		.then(res => {
			return request(app)
				.get(`/api/v1/sources/TEST/peaks`)
				.expect(200);
		})
		.then(res => {
			assert(res.body.peaks.length > 1000);
		})
		.then(() => {
			return request(app)
			.patch('/api/v1/sources/TEST')
			.set('authorization', user.token)
			.send({ id: "TEST1", description: "test1"})
			.expect(200)
			.expect('Content-Type', /json/)
		})
		.then(res => {
			assert.strictEqual(res.body.id, "TEST1");
			assert.strictEqual(res.body.description, "test1");
		})
		.then(() => {
			return common.deleteSource('TEST1');
		})
		.then(() => done())
		.catch(err => done(err));
	});
});
