const Product = require('./../models/product');
const Price = require('./../models/price');
const mailService = require('./service/mail.service');

function getProducts(req, res, next) {
	console.log('req.params', req.params);
	Product.find({})
		.then(
			(products) => {
				let productPrices = [];
				products.forEach((product) => {
					productPrices.push(
						Price.findOne(
							{
								product: product._id,
								country: req.params.country,
								city: req.params.city,
							},
							'product price',
						),
					);
				});
				let productsInfo = [];
				return Promise.all(productPrices).then((allProductPrices) => {
					allProductPrices.forEach((productPrice, index) => {
						console.log('productPrice', productPrice, 'index', index);
						if (productPrice) {
							let product = productPrice.product;
							let price = productPrice.price;
							if (products[index]._id.equals(product)) {
								// products[index] = { ...products[index], price: price };
								productsInfo.push({
									product_category: products[index].toObject().product_category,
									product_name: products[index].toObject().product_name,
									product_unit: products[index].toObject().product_unit,
									_id: products[index].toObject()._id,
									product_info: products[index].toObject().product_info,
									product_price: price,
								});
								console.log('products[index].price', products[index].price);
							} else {
								console.log(
									"product not found in products list. Code flow shouldn't reach here",
								);
							}
						}
					});
					console.log('productsInfo', productsInfo);
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json(productsInfo);
				});
			},
			(err) => {
				console.log('err', err);
				next(err);
			},
		)
		.catch((err) => {
			console.log('err', err);
			next(err);
		});
}

function newItem(req, res, next) {
	const mailData = {
		from: mailService.EMAIL, // sender address
		to: mailService.EMAIL, // list of receivers
		subject: 'New Product Request',
		text: JSON.stringify(req.body),
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
	getProducts,
	newItem,
};
