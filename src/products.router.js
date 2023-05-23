const productsRouter = require('express').Router();
const productsController = require('./products.controller');
const bodyParser = require('body-parser');

productsRouter.use(bodyParser.json());

productsRouter
	.route('/city/:city/country/:country')
	.get(productsController.getProducts);

productsRouter.route('/new').post(productsController.newItem);
module.exports = productsRouter;
