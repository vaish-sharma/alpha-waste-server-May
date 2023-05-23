const indexRouter = require('express').Router();
const indexController = require('./index.controller');
const usersController = require('./users.controller');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');

indexRouter.use(bodyParser.json());

indexRouter.route('/signup').post(indexController.signup);

indexRouter.route('/login').post(indexController.login);

indexRouter.route('/logout').get(indexController.logout);

indexRouter.route('/precondition/:phone').get(indexController.userExists);

indexRouter.route('/isLoggedIn').get(indexController.isLoggedIn);

indexRouter.route('/:userId/verify/:token').get(indexController.verifyUser);

indexRouter
	.route('/requestResetPassword')
	.post(indexController.requestResetPassword);

indexRouter
	.route('/:userId/resetPassword/:token')
	.get(indexController.resetPassword)
	.post(
		body('password')
			.notEmpty()
			.withMessage('Password is required')
			.isLength({ min: 8 })
			.withMessage('Password must be at least 8 characters long')
			.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
			.withMessage(
				'Password must contain at least one uppercase letter, one lowercase letter, and one number',
			),
		body('rePassword')
			.notEmpty()
			.withMessage('Retype password is required')
			.custom((value, { req }) => {
				if (value !== req.body.password) {
					throw new Error('Passwords do not match');
				}
				return true;
			}),
		function (req, res, next) {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				console.log('req.body', req.body);
				console.log('errors in confirmResetPassword', errors);
				return res.render('resetPasswordForm', {
					action: '',
					errors: errors.array(),
					email: req.body.email,
					password: req.body.password,
					rePassword: req.body.rePassword,
				});
			}
			next();
		},
		indexController.confirmResetPassword,
	);

module.exports = indexRouter;
