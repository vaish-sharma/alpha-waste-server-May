const mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;

var countryEnum = ['India'];
var cityEnum = ['Guwahati'];

function getNumber(value) {
	if (typeof value !== 'undefined') {
		return parseFloat(value.toString());
	}
	return value;
}

var priceSchema = new Schema(
	{
		product: {
			type: mongoose.ObjectId,
			required: true,
		},
		country: {
			type: String,
			enum: countryEnum,
			required: true,
		},
		city: {
			type: String,
			enum: cityEnum,
			required: true,
		},
		price: {
			type: mongoose.Decimal128,
			required: true,
			get: getNumber,
		},
		id: false,
	},
	{ toJSON: { getters: true } },
);

priceSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('Price', priceSchema);
