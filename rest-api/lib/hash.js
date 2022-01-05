const scrypt = require('scrypt');

/* Computes the hash of a password given:
 *  - password: string
 *  - salt: Buffer
 */
module.exports = function (password, salt)
{
	let password_buffer = Buffer.from(password);
	return scrypt.hashSync(password_buffer, {"N": 16384, "r": 8, "p": 1}, 64, salt);
}
