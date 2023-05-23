const mainRouter = require('express').Router();
const mainController = require('./main.controller');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');

mainRouter.use(bodyParser.json());

mainRouter.route('/signup').post(mainController.signup);

mainRouter.route('/login').post(mainController.login);

mainRouter.route('/logout').get(mainController.logout);

mainRouter.route('/precondition/:phone').get(mainController.agentExists);

mainRouter
	.route('/requestResetPassword')
	.post(mainController.requestResetPassword);

mainRouter
	.route('/:userId/resetPassword/:token')
	.get(mainController.resetPassword)
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
					errors: errors.array(),
					email: req.body.email,
					password: req.body.password,
					rePassword: req.body.rePassword,
				});
			}
			next();
		},
		mainController.confirmResetPassword,
	);

module.exports = mainRouter;
