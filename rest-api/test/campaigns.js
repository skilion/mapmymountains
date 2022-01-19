const app = require('../app');
const assert = require('assert');
const common = require('./common');
const request = require('supertest');

describe('/api/v1/campaigns', () => {
	let user = null;

	before(done => {
		common.createTestAdminUser((err, res) => {
			if (err) return done(err);
			user = res;
			global.user = user;
			done();
		})
	});

	after(done => {
		common.deleteUser(user.id, err => done(err));
	});

	describe('POST & PATCH', () => {
		it('should create a campaign and edit it', done => {
			let campaignId;
			request(app)
			.post('/api/v1/campaigns')
			.set('authorization', user.token)
			.send({
				name: 'test',
				description: 'test',
				start_time: '2018-08-16T14:58:00.000Z',
				end_time: '2018-09-01T00:00:00Z',
				boundary: [[9,45],[10,45],[10,46]],
				source_id: 'test',
				ref_source_id: 'test'
			})
			.expect(200)
			.expect(res => {
				assert.strictEqual(res.body.name, 'test');
				assert.strictEqual(res.body.description, 'test');
				assert.strictEqual(res.body.start_time, '2018-08-16T14:58:00.000Z');
				assert.strictEqual(res.body.end_time, '2018-09-01T00:00:00.000Z');
				assert(Array.isArray(res.body.boundary));
				assert.strictEqual(res.body.source_id, 'test');
				assert.strictEqual(res.body.ref_source_id, 'test');
				assert.strictEqual(res.body.user_id, user.id);
				campaignId = res.body.id;
			})
			.then(() => {
				return request(app)
				.put(`/api/v1/campaigns/${campaignId}`)
				.set('authorization', user.token)
				.send({
					name: 'test2',
					description: 'test2',
					start_time: '2018-08-16T15:58:00.000Z',
					end_time: '2018-09-01T01:00:00Z',
					boundary: [[9,45],[10,45],[10,46]],
					source_id: 'test'
				})
				.expect(200)
				.expect(res => {
					assert.strictEqual(res.body.description, 'test2');
					assert.strictEqual(res.body.start_time, '2018-08-16T15:58:00.000Z');
					assert.strictEqual(res.body.ref_source_id, null);
				})
			})
			.then(() => done())
			.catch(err => done(err));
		});
	});

	describe('GET', () => {
		let campaign = null;

		before(done => {
			common.createTestCampaign(global.user.token, function (err, res) {
				if (err) return done(err);
				campaign = res;
				// add an annotation
				request(app)
				.post('/api/v1/annotations')
				.set('authorization', global.user.token)
				.send({
					source_element_id: 7118390,
					source_element_version: 0,
					campaign_id: campaign.id,
					valid: true
				}).expect(200, done);
			});
		});

		it('should list campaigns', done => {
			request(app)
			.get('/api/v1/campaigns')
			.set('authorization', user.token)
			.expect(res => {
				assert(Array.isArray(res.body));
				assert(res.body.length > 1);
			})
			.expect(200, done);
		});
		
		it('should get details of a campaign', done => {
			request(app)
			.get('/api/v1/campaigns/' + campaign.id)
			.set('authorization', user.token)
			.expect(res => {
				assert.strictEqual(res.body.name, 'test');
				assert(Array.isArray(res.body.peaks));
				assert(Array.isArray(res.body.ref_peaks));
				assert(res.body.peaks.length > 100);
				assert(res.body.peaks.length === res.body.ref_peaks.length);
				assert(res.body.peaks.some(x => x.annotation && x.annotation.source_element_id == 7118390));
			})
			.expect(200, done);
		});
	});

	describe('DELETE', () => {
		it('should delete a campaign', done => {
			common.createTestCampaign(global.user.token, function (err, campaign) {
				if (err) return done(err);
				request(app)
				.delete('/api/v1/campaigns/' + campaign.id)
				.set('authorization', global.user.token)
				.expect(204, done);
			});
		});
	});
});
