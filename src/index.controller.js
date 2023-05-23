const { Error } = require('mongoose');
const User = require('../models/user');
const mailService = require('./service/mail.service');
const config = require('./shared/config.js');
const ObjectId = require('mongoose').Types.ObjectId;
const Token = require('../models/token');
const { validationResult } = require('express-validator');

function signup(req, res, next) {
	console.log(req.body);
	User.User.findOneAndUpdate(
		{
			email: req.body.email,
		},
		{
			phone: req.body?.phone,
			fullname: req.body.fullname,
			email: req.body.email,
			password: req.body.password,
		},
		{
			new: true,
			upsert: true,
			setDefaultsOnInsert: true,
		},
	)
		.then(
			(user) => {
				if (user) {
					const message = `${config.BASE_URL}index/${user.id}/verify/${user.verificationToken}`;
					const mailData = {
						from: mailService.EMAIL, // sender address
						to: user.email, // list of receivers
						subject: 'Verification from Alpha Waste',
						text: message,
						html: '',
					};
					mailService.transporter.sendMail(mailData, function (err, info) {
						if (err) {
							console.error(err);
							var error = new Error(err);
							error.status = 500;
							next(error);
						} else {
							console.log(info);
							res.statusCode = 200;
							res.setHeader('Content-Type', 'application/json');
							res.json({ status: 'User signed up successfully', user: user });
						}
					});
				} else {
					res.statusCode = 500;
					res.setHeader('Content-Type', 'application/json');
					res.json({ status: 'User sign up failed' });
				}
			},
			(err) => {
				res.statusCode = 500;
				res.setHeader('Content-Type', 'application/json');
				res.json({ status: 'User sign up failed', err: err });
			},
		)
		.catch((err) => {
			res.statusCode = 500;
			res.setHeader('Content-Type', 'application/json');
			res.json({ status: 'Some error', err: err });
		});
}

function login(req, res, next) {
	if (!req.session.userId) {
		var authHeader = req.headers.authorization;
		// if (!authHeader) {
		// 	var err = new Error('You are not authenticated!');
		// 	res.setHeader('WWW-Authenticate', 'Basic');
		// 	err.status = 401;
		// 	return next(err);
		// }
		// var userId = new Buffer.from(authHeader, 'base64').toString();
		console.log('req.body', req.body);
		var userId = req.body.email;
		console.log('cred', userId);

		if (req.body.socialAuth && Object.keys(req.body.socialAuth).length) {
			var socialAuths = req.body.socialAuth;
			var providerName = socialAuths.providerName;
			var providerUserId = socialAuths.providerUserId;
			console.log('req.body.socialAuth', req.body.socialAuth);
			User.User.findOneAndUpdate(
				{
					email: req.body.email,
				},
				{
					email: req.body.email,
				},
				{
					new: true,
					upsert: true,
					setDefaultsOnInsert: true,
				},
			).then(
				(user) => {
					user.socialAuth.push({
						providerName: providerName,
						providerUserId: providerUserId,
					});
					user.save().then(
						(user) => {
							req.session.userId = userId;
							res.statusCode = 200;
							res.setHeader('Content-Type', 'application/json');
							res.json({
								status: 'User signed up and logged in successfully',
								user: user,
							});
						},
						(err) => {
							console.log('err', err);
							res.statusCode = 500;
							res.setHeader('Content-Type', 'application/json');
							res.json({ status: 'User sign up failed', err: err });
							next(err);
						},
					);
				},
				(err) => {
					res.statusCode = 500;
					res.setHeader('Content-Type', 'application/json');
					res.json({ status: 'User sign up failed', err: err });
					next(err);
				},
			);
		} else if (req.body.password) {
			console.log('in req.body.password');
			var password = req.body.password;
			User.User.findOne({
				email: req.body.email,
			})
				.then((user) => {
					console.log('user', user);
					if (user) {
						console.log('in user');
						user.comparePassword(password).then(
							(user) => {
								req.session.userId = userId;
								res.statusCode = 200;
								res.setHeader('Content-Type', 'application/json');
								res.json({
									status: 'User logged in successfully',
									user: user,
								});
							},
							(err) => {
								console.log('Invalid password');
								var err = new Error('Invalid email/password');
								err.status = 401;
								return next(err);
							},
						);
					} else {
						res.statusCode = 404;
						res.setHeader('Content-Type', 'application/json');
						res.json({
							status: 'User ' + userId + ' does not exist!',
							err: err,
						});
						next(err);
					}
				})
				.catch((err) => {
					console.log('err', err);
					res.statusCode = 500;
					res.setHeader('Content-Type', 'application/json');
					res.json({ status: 'User login failed', err: err });
					next(err);
				});
		} else {
			var err = new Error('User ' + userId + ' does not exist!');
			err.status = 404;
			return next(err);
		}
	}
	// 	(err) => {
	// 		res.statusCode = 404;
	// 		res.setHeader('Content-Type', 'application/json');
	// 		res.json({ status: 'User not registered' });
	// 		next(err);
	// 	},
	// )
	// .catch((err) => {
	// 	res.statusCode = 500;
	// 	res.setHeader('Content-Type', 'application/json');
	// 	res.json({ status: 'Some error', err: err });
	// 	next(err);
	// });
	// }
	else {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.json({ status: 'You are already authenticated!' });
	}
}

function logout(req, res, next) {
	if (req.session.userId) {
		req.session.userId.destroy();
		res.clearCookie('session-id');
		res.redirect('/');
	} else {
		var err = new Error('You are not logged in!');
		err.status = 403;
		next(err);
	}
}

function userExists(req, res, next) {
	User.User.findOne({ phone: req.params.phone })
		.then((user) => {
			if (user) {
				console.log('user', user);
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json({ status: 'User exists' });
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

function isLoggedIn(req, res, next) {
	console.log('req.session.user', req.session.user);
	if (req.session.userId) {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.json({ status: 'You are authenticated!' });
	} else {
		res.statusCode = 401;
		res.setHeader('Content-Type', 'application/json');
		res.json({ status: 'You are not authenticated!' });
	}
}

function verifyUser(req, res, next) {
	User.User.findOneAndUpdate(
		{ _id: ObjectId(req.params.userId), verificationToken: req.params.token },
		{
			isVerified: true,
		},
		{
			new: true,
		},
	)
		.then((user) => {
			if (user) {
				console.log('user', user);
				res.statusCode = 200;
				res.setHeader('Content-Type', 'text/html');
				res.render('index', {
					title: 'User verification is successful',
					body: 'Please login to the app to continue.',
				});
			} else {
				let err = new Error('User not found');
				err.statusCode = 404;
				res.setHeader('Content-Type', 'text/html');
				res.render('error', {
					message: 'User verification unsuccessful',
					error: {
						status:
							'You have clicked the wrong link or the user is not registered',
					},
				});
				next(err);
			}
		})
		.catch((error) => {
			console.log('error', error);
			let err = new Error(error);
			next(err);
		});
}

function requestResetPassword(req, res, next) {
	const expiry = config.PASSWORD_RESET_TOKEN_EXPIRY / (60 * 1000);

	User.User.findOne({ email: req.body.email })
		.then((user) => {
			if (user) {
				Token.create({ user: user.id })
					.then((token) => {
						if (token) {
							const message = `Password reset link
					${config.BASE_URL}index/${user.id}/resetPassword/${token.token}
					This link is valid for ${expiry} minutes`;
							console.log(
								'reset password message',
								message,
								' for user ',
								user,
							);
							const mailData = {
								from: mailService.EMAIL, // sender address
								to: user.email, // list of receivers
								subject: 'Password reset link from Alpha Waste',
								text: message,
								html: '',
							};
							mailService.transporter.sendMail(mailData, function (err, info) {
								if (err) {
									console.error(err);
									var error = new Error(err);
									error.status = 500;
									next(error);
								} else {
									console.log(info);
									res.statusCode = 200;
									res.setHeader('Content-Type', 'application/json');
									res.json({
										status: 'Password reset link sent successfully',
									});
								}
							});
						} else {
							res.statusCode = 500;
							res.setHeader('Content-Type', 'application/json');
							res.json({ status: 'Failed to insert token' });
						}
					})
					.catch((err) => {
						var error = new Error(err);
						error.status = 500;
						next(error);
					});
			} else {
				res.statusCode = 404;
				res.setHeader('Content-Type', 'application/json');
				res.json({ status: 'User not found' });
			}
		})
		.catch((err) => {
			var error = new Error(err);
			error.status = 500;
			next(error);
		});
}

function resetPassword(req, res, next) {
	Token.findOne({
		user: req.params.userId,
		token: req.params.token,
	})
		.then((token) => {
			if (token) {
				var expiry = token.expiry;
				var now = Date.now();
				if (now <= expiry) {
					User.User.findById(req.params.userId).then((user) => {
						if (user) {
							console.log('user', user);
							res.render('resetPasswordForm', {
								action: '/index',
								email: user.email,
								userId: user.id,
								token: req.params.token,
							});
						} else {
							res.statusCode = 404;
							res.setHeader('Content-Type', 'text/html');
							res.render('index', {
								title: 'User not found',
							});
						}
					});
				} else {
					res.setHeader('Content-Type', 'text/html');
					res.render('index', {
						title: 'Password reset link has expired.',
						body: 'Please request to reset password from the app again.',
					});
				}
			} else {
				res.statusCode = 404;
				console.log('Token not found');
				res.setHeader('Content-Type', 'text/html');
				res.render('index', {
					title: 'Invalid link. Please try resetting the password again',
				});
			}
		})
		.catch((err) => {
			var error = new Error(err);
			error.status = 500;
			console.log('err', error);
			res.setHeader('Content-Type', 'text/html');
			res.render('index', {
				title: 'Server error. Please try resetting the password again',
			});
			next(error);
		});
}

function confirmResetPassword(req, res, next) {
	console.log('confirmResetPassword');
	User.User.findOne({ email: req.body.email })
		.then((user) => {
			if (user) {
				// do your business
				user.password = req.body.password;
				user
					.save()
					.then((user) => {
						res.statusCode = 200;
						res.render('index', {
							title: 'Password reset successful',
							body: 'Go back to app to login.',
						});
						// res.setHeader('Content-Type', 'application/json');
						// res.json({ status: 'Password reset successfully' });
					})
					.catch((err) => {
						var error = new Error(err);
						error.status = 500;
						next(error);
					});
			} else {
				res.statusCode = 404;
				res.render('index', {
					title: 'Password reset failed',
					body: "User doesn't exist",
				});
				// res.setHeader('Content-Type', 'application/json');
				// res.json({ status: 'User not found' });
			}
		})
		.catch((err) => {
			var error = new Error(err);
			error.status = 500;
			res.render('index', {
				title: 'Password reset failed',
				body: err,
			});
			// next(error);
		});
}

module.exports = {
	signup,
	login,
	logout,
	userExists,
	isLoggedIn,
	verifyUser,
	requestResetPassword,
	resetPassword,
	confirmResetPassword,
};
