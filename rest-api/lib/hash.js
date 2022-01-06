var crypto = require('crypto');

/* Computes the hash of a given password:
 *  - password: string
 *  - salt: Buffer
 */
module.exports = function (password, salt)
{
    const keyLenght = 64;
    return crypto.scryptSync(password, salt, keyLenght);
}
