const nodemailer = require('nodemailer');
const EMAIL = 'alphawaste8@gmail.com';
const PASSWORD = 'ipdgpyfhbbkbysxm';

const transporter = nodemailer.createTransport({
	port: 465, // true for 465, false for other ports
	host: 'smtp.gmail.com',
	auth: {
		user: 'alphawaste8@gmail.com',
		pass: 'ipdgpyfhbbkbysxm',
	},
	secure: true,
});

module.exports = {
	transporter,
	EMAIL,
	PASSWORD,
};
