let chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C',
	'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
	'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g',
	'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
	 'w', 'x', 'y', 'z'];
chars = chars.map(c => c.charCodeAt(0));

module.exports.randomString = function (length) {
	let buf = Buffer.allocUnsafe(length);
	for (let i = 0; i < length; i++) {
		buf[i] = chars[Math.floor(Math.random() * chars.length)];
	}
	return buf.toString();
}

module.exports.randomBuffer = function (length) {
	let buf = Buffer.allocUnsafe(length);
	for (let i = 0; i < length; i++) {
		buf[i] = [Math.floor(Math.random() * 256)];
	}
	return buf;
}