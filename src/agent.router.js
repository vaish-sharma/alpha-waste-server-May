const agentRouter = require('express').Router();
const agentController = require('./agent.controller');
const ordersController = require('./orders.controller');
const bodyParser = require('body-parser');

agentRouter.use(bodyParser.json());

agentRouter
	.route('/')
	.get(agentController.getAgent)
	.put(agentController.updateAgent);

agentRouter
	.route('/:agentId/orders/active')
	.post(ordersController.getActiveOrdersByAgent);

agentRouter.route('/:agentId/orders').post(ordersController.getOrdersByFilter);

module.exports = agentRouter;
