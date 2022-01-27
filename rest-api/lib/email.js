const nodemailer = require("nodemailer");

const config = {
    host: process.env.NODEMAILER_HOST,
    port: process.env.NODEMAILER_PORT,
    secure: process.env.NODEMAILER_SECURE,
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS
    }
}

const transporter = nodemailer.createTransport(config);

/**
 * Sends an email with a link to reset the password of a specified user.
 * @param {string} userId
 * @param {string} email
 * @param {string} code
 */
module.exports.sendPasswordResetEmail = async function(userId, email, code) {
	let encUserId = encodeURIComponent(userId);
	let encCode = encodeURIComponent(code);
	let link = config.website_address + `password_reset?user_id=${encUserId}&code=${encCode}`;
	let mailOptions = {
		"to": email,
		"subject": "MapMyMountains Password reset",
		"text": `Hello ${userId},\n\nuse this link to change your password: ${link}`
	};
	return transporter.sendMail(mailOptions);
}

/**
 * Sends an email with an activation link for the specified user.
 * @param {string} userId
 * @param {string} email
 * @param {string} code
 */
module.exports.sendActivationCodeEmail = async function(userId, email, code) {
	let encUserId = encodeURIComponent(userId);
	let encCode = encodeURIComponent(code);
	let link = config.website_address + `login?user_id=${encUserId}&code=${encCode}`;
	let mailOptions = {
		"to": email,
		"subject": "MapMyMountains User Activation",
		"text": `Hello ${userId},\n\nuse this link to activate your account: ${link}`
	};
	return transporter.sendMail(mailOptions);
}

/**
 * Sends an email with a text feedback.
 * @param {string} text
 */
module.exports.sendFeedback = async function(text) {
	let mailOptions = {
		"to": config.feedback_email,
		"subject": "User Feedback",
		"text": text
	};
	return transporter.sendMail(mailOptions);
}
