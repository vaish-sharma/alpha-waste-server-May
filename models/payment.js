const mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;

function getNumber(value) {
	if (typeof value !== 'undefined') {
		return parseFloat(value.toString());
	}
	return value;
}

let paymentCategoryEnum = ['BANK_ACCOUNT', 'UPI'];

var bankAccountSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		accountNumber: {
			type: String,
			required: true,
		},
		ifsc: {
			type: String,
			required: true,
		},
		expiryMonth: {
			type: Number,
			required: true,
			min: 1,
			max: 12,
		},
		expiryYear: {
			type: Number,
			required: true,
			min: 2000,
		},
		id: false,
	},
	{ toJSON: { getters: true } },
);

var upiSchema = new Schema({
	upi: {
		type: String,
		required: true,
	},
});

var paymentSchema = new Schema({
	type: {
		type: String,
		enum: paymentCategoryEnum,
		required: true,
	},
});

paymentSchema.plugin(passportLocalMongoose);
var Payment = mongoose.model('Payment', paymentSchema);

var BankAccount = Payment.discriminator('BANK_ACCOUNT', bankAccountSchema);

var Upi = Payment.discriminator('UPI', upiSchema);

module.exports = {
	Payment,
	BankAccount,
	Upi,
	paymentSchema,
	paymentCategoryEnum,
};
