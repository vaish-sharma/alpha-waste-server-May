const mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

var agentSchema = new Schema({
	phone: {
		type: String,
		required: false,
		unique: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	fullname: {
		type: String,
		required: true,
	},
	city: {
		type: String,
		required: true,
	},
	country: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	admin: {
		type: Boolean,
		default: false,
	},
	isVerified: {
		type: Boolean,
		default: false,
		required: true,
	},
	isActive: {
		type: Boolean,
		default: true,
		required: true,
	},
});

agentSchema.pre('save', function (next) {
	var agent = this;

	// only hash the password if it has been modified (or is new)
	if (!agent.isModified('password')) return next();

	// generate a salt
	bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
		if (err) return next(err);

		// hash the password using our new salt
		bcrypt.hash(agent.password, salt, function (err, hash) {
			if (err) return next(err);

			// override the cleartext password with the hashed one
			agent.password = hash;
			next();
		});
	});
});

agentSchema.methods.comparePassword = function (candidatePassword, cb) {
	console.log(candidatePassword, this.password);
	return new Promise((resolve, reject) => {
		bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
			console.log('err', err, 'isMatch', isMatch);
			if (err) return reject(err);
			else return resolve(isMatch);
		});
	});
};

agentSchema.plugin(passportLocalMongoose);
var Agent = mongoose.model('Agent', agentSchema);
module.exports = { Agent, agentSchema };
