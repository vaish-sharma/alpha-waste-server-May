const mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;
const address = require('./address');
const { paymentSchema } = require('./payment');

var orderStatusEnum = ['PENDING', 'COMPLETED', 'CANCELLED'];

function getNumber(value) {
	if (typeof value !== 'undefined') {
		return parseFloat(value.toString());
	}
	return value;
}

var orderItemSchema = new Schema(
	{
		item_name: {
			type: String,
			required: true,
		},
		item_units: {
			type: mongoose.Decimal128,
			get: getNumber,
			default: 0,
		},
		item_amt: {
			type: mongoose.Decimal128,
			get: getNumber,
			required: true,
			default: 0,
		},
		item_wunit: {
			type: String,
			required: true,
		},
		id: false,
	},
	{ toJSON: { getters: true } },
);

var orderSchema = new Schema(
	{
		user: {
			type: mongoose.ObjectId,
			required: true,
		},
		items: [orderItemSchema],
		address: {
			type: address.addressSchema,
			required: true,
		},
		order_created_date: {
			type: Date,
			default: Date.now,
		},
		order_scheduled_date: {
			type: Date,
		},
		order_completed_date: {
			type: Date,
		},
		order_amt: {
			type: mongoose.Decimal128,
			default: 0,
			get: getNumber,
		},
		agent: {
			type: mongoose.ObjectId,
			required: false,
		},
		payment: {
			type: paymentSchema,
			required: true,
		},
		status: {
			type: String,
			enum: orderStatusEnum,
			required: true,
			default: 'PENDING',
		},
		id: false,
	},
	{ toJSON: { getters: true } },
);

orderSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('Order', orderSchema);
