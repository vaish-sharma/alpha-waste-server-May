const mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var config = require('./../src/shared/config');

function genCode() {
	const code = crypto.randomBytes(32).toString('hex');
	console.log('code', code);
	return code;
}

function getExpiry() {
	return Date.now() + config.PASSWORD_RESET_TOKEN_EXPIRY;
}

var tokenSchema = new Schema({
	token: {
		type: String,
		required: true,
		default: genCode,
	},
	user: {
		type: mongoose.ObjectId,
		required: true,
	},
	expiry: {
		type: Date,
		default: getExpiry,
		required: true,
	},
});

tokenSchema.plugin(passportLocalMongoose);
var Token = mongoose.model('Token', tokenSchema);
module.exports = Token;
