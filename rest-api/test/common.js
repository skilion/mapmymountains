const app = require('../app');
const assert = require('assert');
const random = require('../lib/random');
const request = require('supertest');
const sources = require('../lib/sources');
const users = require('../lib/users');

/**
 * Creates a regular user for testing purposes.
 * @returns {Promise<Object>} Object with id and token if the test user.
 */
async function createTestUser() {
	let result = {
		id: 'test_' + random.randomString(8),
		token: undefined
	}
	await users.create({
		id: result.id,
		password: 'chopsticks',
		email: 'james@gotmail.com',
		preferred_area: [
			[9.109, 45.799],
			[9.346, 45.799],
			[9.346, 45.973],
			[9.109, 45.973]
		]
	});
	await users.update(result.id, { active: true });
	await request(app)
	.post('/api/v1/login/')
	.send({user: result.id, password: 'chopsticks'})
	.expect(200)
	.then(res => {
		assert(res.body.token);
		assert(res.body.expiration_time);
		result.token = res.body.token;
	});
	return result;
}

module.exports.createTestUser = createTestUser;

/**
 * Creates an admin user for testing purposes.
 * @callback callback
 * @returns {Object} Object with id and token if the test user.
 */
module.exports.createTestAdminUser = function (callback) {
	let admin;
	createTestUser()
	.then(user => {
		admin = user;
		return users.setUserPermissions(user.id, [
			'create_annotation',
			'create_campaign',
			'edit_element',
			'upload_peaks',
			'view_stats',
			'edit_users',
			'search'
		]);
	})
	.then(() => callback(null, admin))
	.catch(err => callback(err));
}

/**
 * Deletes an user.
 * @param {string} userId - The user ID.
 * @param {function} callback - The callback function.
 */
module.exports.deleteUser = function (userId, callback) {
	users.delete(userId)
	.then(() => callback(null))
	.catch(err => callback(err));
}

/**
 * Creates a test campaign. Returns the campaign object.
 * @param {string} token - The user token.
 * @param {function} callback - The callback function.
 */
module.exports.createTestCampaign = function (token, callback)
{
	request(app)
	.post('/api/v1/campaigns')
	.set('authorization', token)
	.send({
		name: 'test',
		description: 'test',
		start_time: '2018-08-16T14:58:00.000Z',
		end_time: '2018-09-01T00:00:00Z',
		boundary: [[7.5,45.5],[8,45.5],[8,46],[7.5,46]],
		source_id: 'test',
		ref_source_id: 'test'
	})
	.expect(200)
	.then(res => callback(null, res.body))
	.catch(err => callback(err));
}

/**
 * Deletes a source.
 * @param {string} sourceId 
 */
module.exports.deleteSource = async function (sourceId, token)
{
	return sources.delete(sourceId);
}
