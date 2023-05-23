const mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;
var address = require('./address');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var SALT_WORK_FACTOR = 10;

function genCode() {
	const code = crypto.randomBytes(32).toString('hex');
	console.log('code', code);
	return code;
}

var socialAuthSchema = new Schema({
	providerName: {
		type: String,
		required: true,
	},
	providerUserId: {
		type: String,
		required: true,
	},
});

var userSchema = new Schema({
	phone: {
		type: String,
		required: false,
		unique: true,
	},
	fullname: {
		type: String,
		required: false,
	},
	address: [address.addressSchema],
	admin: {
		type: Boolean,
		default: false,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		default: null,
	},
	isVerified: {
		type: Boolean,
		default: false,
		required: true,
	},
	verificationToken: {
		type: String,
		default: genCode,
		required: true,
	},
	socialAuth: [socialAuthSchema],
});

userSchema.pre('save', function (next) {
	var user = this;
	if (user.isModified('password') || this.isNew) {
		console.log('password modified');
	} else {
		console.log('password not modified');
	}
	// only hash the password if it has been modified (or is new)
	if (!user.isModified('password') && !this.isNew) return next();

	// generate a salt
	bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
		if (err) return next(err);

		// hash the password using our new salt
		bcrypt.hash(user.password, salt, function (err, hash) {
			if (err) return next(err);

			// override the cleartext password with the hashed one
			user.password = hash;
			next();
		});
	});
});

userSchema.pre('validate', function (next) {
	var user = this;
	if (user.isModified('address')) {
		console.log('this', user);
		var adds = user.address;
		var defaultAdd = adds.filter((add) => {
			return add.default;
		});
		if (defaultAdd && defaultAdd.length > 1) {
			this.invalidate(
				'address',
				'A user cannot have more than 1 default address',
				adds.pop(),
			);
		}
	}
	next();
});

userSchema.methods.comparePassword = function (candidatePassword, cb) {
	console.log(candidatePassword, this.password);
	if (this.password) {
		return new Promise((resolve, reject) => {
			bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
				console.log('err', err, 'isMatch', isMatch);
				if (err) return reject(err);
				else return resolve(isMatch);
			});
		});
	} else {
		return new Promise((resolve, reject) => {
			return reject(new Error('User not signed up with email/password'));
		});
	}
};

userSchema.plugin(passportLocalMongoose);
var User = mongoose.model('User', userSchema);
module.exports = { User, userSchema };
