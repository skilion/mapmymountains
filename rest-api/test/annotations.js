const app = require('../app');
const assert = require('assert');
const common = require('./common');
const request = require('supertest');

describe('/api/v1/annotations', () => {
	let user, admin, campaign;

	before(done => {
		common.createTestUser()
		.then(res => {
			user = res;
			common.createTestAdminUser((err, res) => {
				if (err) return done(err);
				admin = res;
				common.createTestCampaign(admin.token, (err, res) => {
					if (err) return done(err);
					campaign = res;
					done();
				});
			});
		})
		.catch(err => done(err));
	});

	after(done => {
		common.deleteUser(user.id, () => {
			common.deleteUser(admin.id, done);
		});
	});

	it('annotate element, update the annotation, and test if it is returned', done => {
		let annotation;

		// create annotation
		request(app)
		.post('/api/v1/annotations')
		.set('authorization', user.token)
		.send({
			campaign_id: campaign.id,
			source_element_id: 7118390,
			source_element_version: 0,
			name: 'test',
			valid: false
		})
		.expect(200)
		.then(res => {
			annotation = res.body;
			assert.strictEqual(annotation.source_element_id, 7118390);
			assert.strictEqual(annotation.name, 'test');
			assert.strictEqual(annotation.valid, false);
			// update annotation
			return request(app)
			.post('/api/v1/annotations')
			.set('authorization', user.token)
			.send({
				campaign_id: campaign.id,
				source_element_id: 7118390,
				source_element_version: 0,
				valid: true,
				name: 'test2',
				elevation: 1001,
				alternate_names: [
					{
						isolanguage: 'it',
						alternate_name: 'test'
					}
				]
			})
			.expect(200);
		})
		.then(() => {
			// get annotation
			return request(app)
			.get(`/api/v1/annotations/${campaign.id}`)
			.set('authorization', admin.token)
			.expect(200)
			.expect(res => {
				assert.strictEqual(typeof res.body, 'object');
				assert.strictEqual(Object.keys(res.body).length, 1);
				assert.strictEqual(res.body[7118390][0].campaign_id, annotation.campaign_id);
				assert.strictEqual(res.body[7118390][0].source_element_id, annotation.source_element_id);
				assert.strictEqual(res.body[7118390][0].valid, true);
				assert.strictEqual(res.body[7118390][0].name, 'test2');
				assert.strictEqual(res.body[7118390][0].elevation, 1001);
				assert(Array.isArray(res.body[7118390][0].alternate_names));
				assert.strictEqual(res.body[7118390][0].alternate_names.length, 1);
				assert.strictEqual(res.body[7118390][0].alternate_names[0].isolanguage, 'it');
				assert.strictEqual(res.body[7118390][0].alternate_names[0].alternate_name, 'test');

			})
		})
		.then(() => done())
		.catch(err => done(err));
	});


	it('annotate element with a similar one', done => {
		let annotation;

		// create annotation
		request(app)
		.post('/api/v1/annotations')
		.set('authorization', user.token)
		.send({
			campaign_id: campaign.id,
			source_element_id: 7118390,
			source_element_version: 0,
			valid: true,
			similar_element_id: 7555002,
			similar_element_version: 0
		})
		.expect(200)
		.then(res => {
			annotation = res.body;
			assert.strictEqual(annotation.source_element_id, 7118390);
			assert.strictEqual(annotation.source_element_version, 0);
			assert.strictEqual(annotation.similar_element_id, 7555002);
			assert.strictEqual(annotation.similar_element_version, 0);
		})
		.then(() => done())
		.catch(err => done(err));
	});
});
