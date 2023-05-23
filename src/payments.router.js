const paymentsRouter = require('express').Router();
const paymentsController = require('./payments.controller');
const bodyParser = require('body-parser');

paymentsRouter.use(bodyParser.json());

paymentsRouter
	.route('/')
	.get(paymentsController.getPayments)
	.post(paymentsController.createPayment);

paymentsRouter
	.route('/:paymentId')
	.get(paymentsController.getPaymentById)
	.delete(paymentsController.deletePaymentById);

paymentsRouter
	.route('/:transactionStatus')
	.post(paymentsController.processTransactionStatus)