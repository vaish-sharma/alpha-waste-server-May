const ordersRouter = require('express').Router();
const orderController = require('./orders.controller');
const bodyParser = require('body-parser');

ordersRouter.use(bodyParser.json());

ordersRouter
	.route('/')
	.get(orderController.getOrder)
	.post(orderController.createOrder);

ordersRouter
	.route('/:orderId')
	.get(orderController.getOrderById)
	.put(orderController.updateOrderById)
	.delete(orderController.deleteOrderbyId);

ordersRouter
	.route('/:orderId/payment')
	.put(orderController.updatePaymentOfOrder);

ordersRouter
	.route('/:orderId/address')
	.put(orderController.updateAddressOfOrder);

ordersRouter
	.route('/:orderId/items')
	.get(orderController.getOrderItems)
	.post(orderController.createOrderItem);

ordersRouter
	.route('/:orderId/items/:itemId')
	.put(orderController.updateOrderItemById)
	.delete(orderController.deleteOrderItemById);

module.exports = ordersRouter;
