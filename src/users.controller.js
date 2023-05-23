const User = require('../models/user');
const ObjectId = require('mongoose').Types.ObjectId;
const mailService = require('./service/mail.service');

function getUser(req, res, next) {
	if (req.session.userId) {
		User.User.findOne({ email: req.session.userId })
			.then((user) => {
				if (user) {
					console.log('user', user);
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json(user);
				} else {
					let err = new Error('User not found');
					err.statusCode = 404;
					next(err);
				}
			})
			.catch((err) => {
				console.log('err', err);
				err.statusCode = 404;
				err.json({ status: 'User not found' });
				next(err);
			});
	} else {
		//code control shouldn't come here
		let err = new Error('You are not authenticated');
		err.statusCode = 403;
		next(err);
	}
}

function getUserById(req, res, next) {
	User.User.findOne({ _id: ObjectId(req.params.userId) })
		.then((user) => {
			if (user) {
				console.log('user', user);
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json(user);
			} else {
				let err = new Error('User not found');
				err.statusCode = 404;
				next(err);
			}
		})
		.catch((err) => {
			console.log('err', err);
			err.statusCode = 404;
			err.json({ status: 'User not found' });
			next(err);
		});
}

function getAddresses(req, res, next) {
	User.User.findOne(
		{
			email: req.params.userId,
		},
		'address',
	)
		.then(
			(address) => {
				if (address) {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json(address);
				} else {
					let err = new Error('User/Address not found');
					err.statusCode = 404;
					next(err);
				}
			},
			(err) => next(err),
		)
		.catch((err) => next(err));
}

function createAddress(req, res, next) {
	console.log('route: ', req.path);
	User.User.findById(req.params.userId)
		.then((user) => {
			console.log('User', user);
			if (user) {
				console.log('req.body', req.body);
				// if (user.address.length === 0) {
				// 	req.body.default = true;
				// } else {
				// 	req.body.default = false;
				// }
				// console.log('req.body.default', req.body.default);
				user.address.push(req.body);
				user.save().then(
					(user) => {
						console.log('Successfully added address');
						res.statusCode = 200;
						console.log('user.address', user.address);
						res.setHeader('Content-Type', 'application/json');
						res.json(user.address[user.address.length - 1]);
					},
					(err) => {
						console.log('createAddress err', err);
						next(err);
					},
				);
			} else {
				let err = new Error('User with phone:', req.body.phone, 'not found');
				err.statusCode = 403;
				return next(err);
			}
		})
		.catch((err) => next(err));
}

function deleteAddresses(req, res, next) {
	User.User.findOne({ phone: req.params.userId })
		.then((user) => {
			if (user) {
				user.address = null;
				user.save().then(
					(user) => {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						res.json(user);
					},
					(err) => next(err),
				);
			} else {
				let err = new Error('User with phone:', req.body.phone, 'not found');
				err.statusCode = 403;
				return next(err);
			}
		})
		.catch((err) => next(err));
}

function getAddressById(req, res, next) {
	User.User.findOne({ phone: req.params.userId })
		.then(
			(user) => {
				if (user != null) {
					if (user.address.id(req.params.addressId) != null) {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						res.json(user.address.id(req.params.addressId));
					} else {
						let err = new Error(
							'Address with ' + req.params.addressId + ' not found',
						);
						err.statusCode = 404;
						return next(err);
					}
				} else {
					let err = new Error('User with ' + req.params.userId + ' not found');
					err.statusCode = 404;
					return next(err);
				}
			},
			(err) => next(err),
		)
		.catch((err) => next(err));
}

function updateAddressbyId(req, res, next) {
	User.User.findById(req.params.userId).then((user) => {
		if (user) {
			let address = user.address.id(req.params.addressId);
			if (address) {
				console.log('req.body', req.body);
				Object.keys(req.body).forEach(function (key) {
					console.log('Key : ' + key + ', Value : ' + req.body[key]);
					address[key] = req.body[key];
				});
				user
					.save()
					.then((user) => {
						res.statusCode = 200;
						res.json(user.address.id(req.params.addressId));
					})
					.catch((err) => {
						console.log(err);
						next(err);
					});
			} else {
				let err = new Error(
					'Address with ' + req.params.addressId + ' not found',
				);
				console.log(err);
				return next(err);
			}
		} else {
			let err = new Error('User with ' + req.params.userId + ' not found');
			console.log(err);
			return next(err);
		}
	});
}

function deleteAddressById(req, res, next) {
	User.User.findById(req.params.userId)
		.then(
			(user) => {
				if (user != null) {
					if (user.address.id(req.params.addressId)) {
						user.address.id(req.params.addressId).remove();
						user
							.save()
							.then((user) => {
								res.statusCode = 200;
								res.json(user);
							})
							.catch((err) => next(err));
					} else {
						let err = new Error(
							'Address with ' + req.params.adressId + ' not found',
						);
						return next(err);
					}
				} else {
					let err = new Error('User with ' + req.params.userId + ' not found');
					err.statusCode = 404;
					return next(err);
				}
			},
			(err) => next(err),
		)
		.catch((err) => next(err));
}

function reportIssue(req, res, next) {
	const issue = {
		user: req.params.userId,
		...req.body,
	};
	const mailData = {
		from: mailService.EMAIL, // sender address
		to: mailService.EMAIL, // list of receivers
		subject: 'Issue reported',
		text: JSON.stringify(issue),
		html: '',
	};
	mailService.transporter.sendMail(mailData, function (err, info) {
		if (err) {
			console.error(err);
			var error = new Error(err);
			err.status = 500;
			next(error);
		} else {
			console.log(info);
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.json(info);
		}
	});
}

module.exports = {
	getUser,
	getUserById,
	getAddresses,
	createAddress,
	deleteAddresses,
	getAddressById,
	updateAddressbyId,
	deleteAddressById,
	reportIssue,
};
