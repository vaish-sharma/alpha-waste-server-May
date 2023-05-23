const otpGenerator = require('otp-generator');
var AWS = require('aws-sdk');

function sendOTP(phone) {
	const addMinutesToDate = (date, minutes) => {
		return new Date(date.getTime() + minutes * 60000);
	};
	const otp = otpGenerator.generate(6, {
		alphabets: false,
		upperCase: false,
		specialChars: false,
	});

	const now = new Date();
	const expiration_time = addMinutesToDate(now, 10);
	AWS.config.update({ region: 'Asia Pacific(Mumbai)' });
	var params = {
		Message: 'OTP for logging into alpha waste',
		PhoneNumber: phone,
	};
	var publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' })
		.publish(params)
		.promise();

	//Send response back to the client if the message is sent
	publishTextPromise
		.then(function (data) {
			return {
				statusCode: 200,
				status: 'success',
				data: data,
			}; //res.send({ Status: 'Success', Details: data });
		})
		.catch(function (err) {
			return {
				statusCode: 400,
				status: 'failure',
				data: err,
			};
			//res.status(400).send({ Status: 'Failure', Details: err });
		});
}
