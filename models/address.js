const mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;

var addressSchema = new Schema({
	fullname: {
		type: String,
		required: true,
	},
	phone: {
		type: String,
		required: true,
	},
	pincode: {
		type: Number,
		required: true,
	},
	add_lower: {
		type: String,
		required: true,
	},
	add_higher: {
		type: String,
		required: true,
	},
	landmark: {
		type: String,
	},
	city: {
		type: String,
		required: true,
	},
	state: {
		type: String,
		required: true,
	},
	default: {
		type: Boolean,
		required: true,
	},
});

// addressSchema.index(
// 	{ _id: 1, default: 1 },
// 	{ unique: true, partialFilterExpression: { default: true } },
// );

addressSchema.plugin(passportLocalMongoose);
var Address = mongoose.model('Address', addressSchema);
module.exports = { Address, addressSchema };
