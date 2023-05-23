const Order = require('../models/order');
const { BankAccount, Upi, paymentCategoryEnum } = require('../models/payment');
const ObjectId = require('mongoose').Types.ObjectId;
const config = require('./shared/config');

function getOrder(req, res, next) {
	Order.find()
		.then(
			(order) => {
				if (order) {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					console.log('res order', order);
					res.json(order);
				} else {
					let err = new Error('Orders not found');
					err.statusCode = 404;
					next(err);
				}
			},
			(err) => {
				console.log('err', err);
				let error = new Error(err);
				error.status = 500;
				next(error);
			},
		)
		.catch((err) => {
			console.log('err', err);
			let error = new Error(err);
			error.status = 500;
			next(error);
		});
}

function createOrder(req, res, next) {
	let orderScheduleDate = new Date();
	orderScheduleDate.setDate(
		orderScheduleDate.getDate() + config.ORDER_LEAD_TIME, //check for the case when the month chnages
	);
	let dateString =
		orderScheduleDate.getFullYear() +
		'-' +
		orderScheduleDate.getMonth() +
		'-' +
		orderScheduleDate.getDate();
	console.log('orderScheduleDate', dateString);
	req.body.order_scheduled_date = orderScheduleDate;
	console.log('req.body', req.body);
	var payment;
	if (req.body?.payment?.type === 'BANK_ACCOUNT') {
		payment = new BankAccount(req.body.payment);
	} else if (req.body?.payment?.type === 'UPI') {
		payment = new Upi(req.body.payment);
	}
	payment
		.save()
		.then((pay) => {
			Order.create({ ...req.body, payment: pay })
				.then(
					(order) => {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						res.json(order);
					},
					(err) => {
						console.log(err);
						let error = new Error(err);
						error.status = 500;
						next(error);
					},
				)
				.catch((err) => {
					console.log(err);
					let error = new Error(err);
					error.status = 500;
					next(error);
				});
		})
		.catch((err) => {
			console.log(err);
			let error = new Error(err);
			error.status = 400;
			next(error);
		});
}

function getOrderById(req, res, next) {
	console.log(req.body);
	Order.findById(req.params.orderId)
		.then(
			(order) => {
				if (order) {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json(order);
				} else {
					let err = new Error('Order not found');
					err.statusCode = 404;
					next(err);
				}
			},
			(err) => {
				console.log(err);
				let error = new Error(err);
				error.status = 500;
				next(error);
			},
		)
		.catch((err) => {
			console.log(err);
			let error = new Error(err);
			error.status = 500;
			next(error);
		});
}

function updateOrderById(req, res, next) {
	var allowedPaths = [
		'order_scheduled_date',
		'order_completed_date',
		'order_amt',
		'agent',
		'status',
	];
	console.log('req.body before santisation', req.body);
	var body = {};
	for (let path of allowedPaths) {
		if (req.body?.[path]) {
			console.log('req.body?.[path]', req.body?.[path]);
			body[path] = req.body?.[path];
		}
	}
	req.body = body;
	console.log('req.body after sanitisation', req.body);
	Order.findOneAndUpdate(
		{ _id: req.params.orderId },
		{ $set: req.body },
		{ new: true },
	)
		.then(
			(order) => {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json(order);
			},
			(err) => {
				console.log(err);
				let error = new Error(err);
				error.status = 500;
				next(error);
			},
		)
		.catch((err) => {
			console.log(err);
			let error = new Error(err);
			error.status = 500;
			next(error);
		});
}

function deleteOrderbyId(req, res, next) {
	Order.deleteOne({ _id: req.params.orderId })
		.then(
			(order) => {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json(order);
			},
			(err) => {
				console.log(err);
				let error = new Error(err);
				error.status = 500;
				next(error);
			},
		)
		.catch((err) => {
			console.log(err);
			let error = new Error(err);
			error.status = 500;
			next(error);
		});
}

function getOrdersByUser(req, res, next) {
	console.log('req.params', req.params);
	Order.find({ user: ObjectId(req.params.userId) })
		.then(
			(order) => {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json(order);
			},
			(err) => {
				console.log(err);
				let error = new Error(err);
				error.status = 500;
				next(error);
			},
		)
		.catch((err) => {
			console.log(err);
			let error = new Error(err);
			error.status = 500;
			next(error);
		});
}

function updateOrderItemById(req, res, next) {
	console.log(req);
	Order.findById(req.params.orderId)
		.then(
			(order) => {
				if (order) {
					console.log(order);
					var item = order.items.id(req.params.itemId);
					console.log('Item: ', item);
					if (req.body.item_units) {
						item.item_units = req.body.item_units;
					}
					if (req.body.item_amt) {
						item.item_amt = req.body.item_amt;
					}
					order.order_amt =
						(order.order_amt ? order.order_amt : 0) +
						item.item_units * item.item_amt;
					order.save().then(
						(order) => {
							res.statusCode = 200;
							res.setHeader('Content-Type', 'application/json');
							res.json(order);
						},
						(err) => {
							console.log('err', err);
							return next(err);
						},
					);
				} else {
					res.statusCode = 404;
					res.setHeader('Content-Type', 'application/json');
					res.json({ status: 'Order not found' });
				}
			},
			(err) => {
				console.log(err);
				let error = new Error(err);
				error.status = 500;
				next(error);
			},
		)
		.catch((err) => {
			console.log(err);
			let error = new Error(err);
			error.status = 500;
			next(error);
		});
}

function deleteOrderItemById(req, res, next) {
	Order.findById(req.params.orderId)
		.then(
			(order) => {
				if (order) {
					if (order.items.id(req.params.itemId)) {
						order.items.id(req.params.itemId).remove();
						order.save().then(
							(order) => {
								res.statusCode = 200;
								res.setHeader('Content-Type', 'application/json');
								res.json(order);
							},
							(err) => next(err),
						);
					}
				} else {
					res.statusCode = 404;
					res.setHeader('Content-Type', 'application/json');
					res.json({ status: 'Order not found' });
				}
			},
			(err) => {
				console.log(err);
				let error = new Error(err);
				error.status = 500;
				next(error);
			},
		)
		.catch((err) => {
			console.log(err);
			let error = new Error(err);
			error.status = 500;
			next(error);
		});
}

function createOrderItem(req, res, next) {
	Order.findById(req.params.orderId)
		.then(
			(order) => {
				if (order) {
					order.items.push(req.body);
					order.save().then(
						(order) => {
							res.statusCode = 200;
							res.setHeader('Content-Type', 'application/json');
							res.json(order);
						},
						(err) => next(err),
					);
				} else {
					res.statusCode = 404;
					res.setHeader('Content-Type', 'application/json');
					res.json({ status: 'Order not found' });
				}
			},
			(err) => {
				console.log(err);
				let error = new Error(err);
				error.status = 500;
				next(error);
			},
		)
		.catch((err) => {
			console.log(err);
			let error = new Error(err);
			error.status = 500;
			next(error);
		});
}

function getOrderItems(req, res, next) {
	Order.findOne({ _id: req.params.orderId })
		.then(
			(order) => {
				if (order) {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json(order.items);
				} else {
					res.statusCode = 404;
					res.setHeader('Content-Type', 'application/json');
					res.json({ status: 'Order not found' });
				}
			},
			(err) => {
				console.log(err);
				let error = new Error(err);
				error.status = 500;
				next(error);
			},
		)
		.catch((err) => {
			console.log(err);
			let error = new Error(err);
			error.status = 500;
			next(error);
		});
}

function getActiveOrdersByAgent(req, res, next) {
	console.log('req.params', req.params);
	let today = new Date();
	today.setHours(0, 0, 0);
	let tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 10 /*config.ORDER_LEAD_TIME*/);
	console.log('today', today, 'tomorrow', tomorrow);
	req.body = {
		agent: ObjectId(req.params.agentId),
		order_scheduled_date: { $gte: today, $lte: tomorrow },
		status: 'PENDING',
	};
	return getOrdersByFilter(req, res, next);
}

function getOrdersByFilter(req, res, next) {
	Order.find({
		...req.body,
	})
		.then(
			(order) => {
				if (order) {
					console.log('order', order);
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json(order);
				} else {
					let err = new Error('Order not found');
					err.statusCode = 404;
					next(err);
				}
			},
			(err) => {
				console.log(err);
				let error = new Error(err);
				error.status = 500;
				next(error);
			},
		)
		.catch((err) => {
			console.log(err);
			let error = new Error(err);
			error.status = 500;
			next(error);
		});
}

function getOrdersByDate(req, res, next) {
	console.log('req.params', req.params);
	Order.find({ orderScheduleDate: new Date(req.params.date) })
		.then(
			(order) => {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json(order);
			},
			(err) => {
				console.log(err);
				let error = new Error(err);
				error.status = 500;
				next(error);
			},
		)
		.catch((err) => {
			console.log(err);
			let error = new Error(err);
			error.status = 500;
			next(error);
		});
}

function updatePaymentOfOrder(req, res, next) {
	if (
		req.body?.payment &&
		paymentCategoryEnum.includes(req.body?.payment?.type)
	) {
		var payment;
		if (req.body?.payment?.type === 'BANK_ACCOUNT') {
			payment = new BankAccount(req.body.payment);
		} else if (req.body?.payment?.type === 'UPI') {
			payment = new Upi(req.body.payment);
		}
		payment
			.save()
			.then((pay) => {
				Order.findOneAndUpdate(
					{ _id: req.params.orderId },
					{ payment: pay },
					{ new: true },
				)
					.then(
						(order) => {
							res.statusCode = 200;
							res.setHeader('Content-Type', 'application/json');
							res.json(order);
						},
						(err) => {
							console.log(err);
							let error = new Error(err);
							error.status = 500;
							next(error);
						},
					)
					.catch((err) => {
						console.log(err);
						let error = new Error(err);
						error.status = 500;
						next(error);
					});
			})
			.catch((err) => {
				console.log('err in payment.save() ', err);
				let error = new Error(err);
				error.status = 500;
				next(error);
			});
	} else {
		console.log('Undefined req.body?.payment');
		let error = new Error('Bad Request');
		error.status = 400;
		next(error);
	}
}

function updateAddressOfOrder(req, res, next) {
	if (req.body?.address) {
		Order.findOneAndUpdate(
			{ _id: req.params.orderId },
			{ address: req.body?.address },
			{ new: true },
		)
			.then(
				(order) => {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json(order);
				},
				(err) => {
					console.log(err);
					let error = new Error(err);
					error.status = 500;
					next(error);
				},
			)
			.catch((err) => {
				console.log(err);
				let error = new Error(err);
				error.status = 500;
				next(error);
			});
	} else {
		console.log('Undefined req.body?.address');
		let error = new Error('Bad Request');
		error.status = 400;
		next(error);
	}
}

module.exports = {
	getOrder,
	createOrder,
	getOrderById,
	updateOrderById,
	deleteOrderbyId,
	getOrdersByUser,
	updateOrderItemById,
	deleteOrderItemById,
	createOrderItem,
	getOrderItems,
	getActiveOrdersByAgent,
	getOrdersByDate,
	updatePaymentOfOrder,
	updateAddressOfOrder,
	getOrdersByFilter,
};
