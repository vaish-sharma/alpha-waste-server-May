const { Agent } = require('../models/agent');
const mailService = require('./service/mail.service');
const config = require('./shared/config.js');
const Token = require('../models/token');

function signup(req, res, next) {
	console.log(req.body);
	Agent.findOne({ email: req.body.email })
		.then(
			(user) => {
				if (user) {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json({ status: 'User already exists', user: user });
				} else {
					Agent.create({
						email: req.body.email,
						phone: req.body?.phone,
						fullname: req.body.fullname,
						country: req.body.country,
						city: req.body.city,
						password: req.body.password,
					}).then(
						(user) => {
							res.statusCode = 200;
							res.setHeader('Content-Type', 'application/json');
							res.json({ status: 'User signed up successfully', user: user });
						},
						(err) => {
							console.log('err', err);
							res.statusCode = 500;
							res.setHeader('Content-Type', 'application/json');
							res.json({ status: 'User sign up failed', err: err });
						},
					);
				}
			},
			(err) => {
				console.log('err', err);
				res.statusCode = 500;
				res.setHeader('Content-Type', 'application/json');
				res.json({ status: 'Some error', err: err });
			},
		)
		.catch((err) => {
			console.log('err', err);
			res.statusCode = 500;
			res.setHeader('Content-Type', 'application/json');
			res.json({ status: 'Some error', err: err });
		});
}

function login(req, res, next) {
	if (!req.session.agentId || true) {
		var authHeader = req.headers.authorization;
		console.log('cred', req.body);
		Agent.findOne({ email: req.body.email })
			.then(
				(user) => {
					if (user) {
						//if password matches
						user
							.comparePassword(req.body.password)
							.then((user) => {
								console.log('user', user);
								if (user === true) {
									req.session.agentId = req.body.email;
									console.log('req.agentSession', req.agentSession);
									console.log('req.agentSession.id', req.agentSession.id);
									res.statusCode = 200;
									res.setHeader('Content-Type', 'application/json');
									console.log('res.headers', res.headers);
									res.send({ status: 'User logged in successfully' });
									next();
								} else {
									var err = new Error("Either user/email doesn't match");
									err.status = 401;
									return next(err);
								}
							})
							.catch((err) => {
								console.log('err', err);
								var err = new Error("Either user/email doesn't match");
								err.status = 401;
								return next(err);
							});
					} else {
						var err = new Error('User ' + req.body.email + ' does not exist!');
						err.status = 404;
						return next(err);
					}
				},
				(err) => {
					res.statusCode = 404;
					res.setHeader('Content-Type', 'application/json');
					res.json({ status: 'User not registered' });
					next(err);
				},
			)
			.catch((err) => {
				res.statusCode = 500;
				res.setHeader('Content-Type', 'application/json');
				res.json({ status: 'Some error', err: err });
				next(err);
			});
	} else {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/plain');
		res.end('You are already authenticated!');
	}
}

function logout(req, res, next) {
	if (req.agentSession) {
		req.agentSession.destroy();
		res.clearCookie('session-id');
		res.redirect('/');
	} else {
		var err = new Error('You are not logged in!');
		err.status = 403;
		next(err);
	}
}

function agentExists(req, res, next) {
	Agent.findOne({ phone: req.params.phone })
		.then((agent) => {
			if (agent) {
				console.log('agent', agent);
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json(agent);
			} else {
				let err = new Error('Agent not found');
				err.statusCode = 404;
				next(err);
			}
		})
		.catch((err) => {
			console.log('err', err);
			err.statusCode = 404;
			err.json({ status: 'Agent not found' });
			next(err);
		});
}

function requestResetPassword(req, res, next) {
	const expiry = config.PASSWORD_RESET_TOKEN_EXPIRY / (60 * 1000);

	Agent.findOne({ email: req.body.email })
		.then((user) => {
			if (user) {
				Token.create({ user: user.id })
					.then((token) => {
						if (token) {
							const message = `Password reset link
					${config.BASE_URL}main/${user.id}/resetPassword/${token.token}
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
				console.log('req.params.userId', req.params.userId);
				if (now <= expiry) {
					Agent.findById(req.params.userId).then((user) => {
						if (user) {
							console.log('user', user);
							res.render('resetPasswordForm', {
								action: '/main',
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
	Agent.findOne({ email: req.body.email })
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
	agentExists,
	requestResetPassword,
	resetPassword,
	confirmResetPassword,
};
