const { Payment, BankAccount, Upi } = require('../models/payment');
const {
	WHITELISTED_IPS_FOR_TXN_CALLBACK,
	API_KEY_FOR_TXN_CALLBACK,
} = require('./shared/config');
const ObjectId = require('mongoose').Types.ObjectId;

function getPayments(req, res, next) {
	Payment.find({})
		.then(
			(payments) => {
				res.json(payments);
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
			},
			(err) => {
				console.log('err', err);
				let error = new Error(err);
				error.status = 500;
				next(err);
			},
		)
		.catch((err) => {
			console.log('err', err);
			let error = new Error(err);
			error.status = 500;
			next(err);
		});
}

function createBankAccount(req, res, next) {
	BankAccount.create(req.body)
		.then(
			(account) => {
				res.json(account);
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
			},
			(err) => {
				console.log('err', err);
				let error = new Error(err);
				error.status = 500;
				next(err);
			},
		)
		.catch((err) => {
			console.log('err', err);
			let error = new Error(err);
			error.status = 500;
			next(err);
		});
}

function createUPI(req, res, next) {
	Upi.create(req.body)
		.then(
			(upi) => {
				res.json(upi);
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
			},
			(err) => {
				console.log('err', err);
				let error = new Error(err);
				error.status = 500;
				next(err);
			},
		)
		.catch((err) => {
			console.log('err', err);
			let error = new Error(err);
			error.status = 500;
			next(err);
		});
}

function createPayment(req, res, next) {
	console.log('req.body', req.body);
	if (req.body.type === 'BANK_ACCOUNT') {
		let bareq = req;
		bareq.body = req.body.filter((key) => key !== 'type');
		createBankAccount(bareq, res, next)
			.then((account) => {
				Payment.create({
					type: 'BANK_ACCOUNT',
					payment: account._id,
				})
					.then(
						(payment) => {
							res.json({
								...payment,
								...account,
							});
							res.statusCode = 200;
							res.setHeader('Content-Type', 'application/json');
						},
						(err) => {
							console.log('err', err);
							let error = new Error(err);
							error.status = 500;
							next(err);
						},
					)
					.catch((err) => {
						console.log('err', err);
						let error = new Error(err);
						error.status = 500;
						next(err);
					});
			})
			.catch((err) => {
				console.log('err', err);
				let error = new Error(err);
				error.status = 500;
				next(err);
			});
	} else if (req.body.type === 'UPI') {
		let upiReq = req.body;
		upiReq.body = req.body.filter((key) => key !== 'type');
		createUPI(upiReq, res, next)
			.then((upi) => {
				Payment.create({
					type: 'BANK_ACCOUNT',
					payment: upi._id,
				})
					.then(
						(payment) => {
							res.json({
								...payment,
								...upi,
							});
							res.statusCode = 200;
							res.setHeader('Content-Type', 'application/json');
						},
						(err) => {
							console.log('err', err);
							let error = new Error(err);
							error.status = 500;
							next(err);
						},
					)
					.catch((err) => {
						console.log('err', err);
						let error = new Error(err);
						error.status = 500;
						next(err);
					});
			})
			.catch((err) => {
				console.log('err', err);
				let error = new Error(err);
				error.status = 500;
				next(err);
			});
	}
}

function getBankAccountById(req, res, next) {
	BankAccount.findById(req.params.accId)
		.then(
			(account) => {
				if (account) {
					res.json(account);
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
				} else {
					let error = new Error('Bank Account not found');
					error.status = 404;
					next(error);
				}
			},
			(err) => {
				console.log('err', err);
				let error = new Error(err);
				error.status = 500;
				next(err);
			},
		)
		.catch((err) => {
			console.log('err', err);
			let error = new Error(err);
			error.status = 500;
			next(err);
		});
}

function getUpiById(req, res, next) {
	Upi.findById(req.params.upiId)
		.then(
			(upi) => {
				if (upi) {
					res.json(upi);
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
				} else {
					let error = new Error('UPI not found');
					error.status = 404;
					next(error);
				}
			},
			(err) => {
				console.log('err', err);
				let error = new Error(err);
				error.status = 500;
				next(err);
			},
		)
		.catch((err) => {
			console.log('err', err);
			let error = new Error(err);
			error.status = 500;
			next(err);
		});
}

function getPaymentById(req, res, next) {
	Payment.findById(req.params.paymentId).then((payment) => {
		if (payment) {
			let paymentType = payment.type;
			if (paymentType === 'BANK_ACCOUNT') {
				let bareq = req;
				bareq.params = {
					accId: payment.payment,
					...req.params,
				};
				getBankAccountById(bareq, res, next)
					.then(
						(account) => {
							if (account) {
								res.json({
									...account,
									...payment,
								});
								res.statusCode = 200;
								res.setHeader('Content-Type', 'application/json');
							} else {
								console.log('Bank account not found');
								let error = new Error('Bank account not found');
								error.status = 404;
								next(error);
							}
						},
						(err) => {
							console.log('err', err);
							let error = new Error(err);
							error.status = 500;
							next(err);
						},
					)
					.catch((err) => {
						console.log('err', err);
						let error = new Error(err);
						error.status = 500;
						next(err);
					});
			}
		} else {
		}
	});
}

function validateBankAccount(req, res, next) {}

function validateUPI(req, res, next) {}

function makeBankTransfer(req, res, next) {}

function makeUPITransfer(req, res, next) {}

function processTransactionStatus(req, res, next) {
	if (WHITELISTED_IPS_FOR_TXN_CALLBACK.includes(req.id)) {
		if (req.get('api-key') === API_KEY_FOR_TXN_CALLBACK) {
		}
	} else {
		var err = new Error('Unauthorised access');
		err.status = 401;
		next(err);
	}
}

module.exports = {
	getPayments,
	createPayment,
	getPaymentById,
};
