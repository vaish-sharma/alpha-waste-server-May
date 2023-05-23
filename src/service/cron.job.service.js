const CronJob = require('node-cron');
const Order = require('./../../models/order');
const Config = require('./../shared/config');
const { Agent } = require('./../../models/agent');
const { geocode, clusterise } = require('./geocode.service.js');
const ObjectId = require('mongoose').Types.ObjectId;

exports.allocateOrders = () => {
	let today = new Date();
	let tomorrow = new Date();
	tomorrow.setDate(today.getDate() + 1);
	console.log(today, tomorrow);
	//use disk option and full error option
	Order.aggregate([
		{
			$match: {
				status: 'PENDING',
				order_scheduled_date: {
					$gte: today,
					$lt: tomorrow,
				},
			},
		},
		{
			$group: {
				_id: '$address.city',
				orders: {
					$push: '$$ROOT',
				},
			},
		},
	])
		.then((orders) => {
			console.log('orders', orders);
			if (orders !== undefined) {
				Agent.aggregate([
					{
						$match: {
							isVerified: true,
							isActive: true,
						},
					},
					{
						$group: {
							_id: '$city',
							count: { $sum: 1 },
							agents: {
								$push: '$$ROOT',
							},
						},
					},
				]).then((agents) => {
					console.log('agents', agents);
					const updateOrderById = (orderId, update) => {
						return Order.findOneAndUpdate(
							{ _id: orderId },
							{ $set: update },
							{ new: true },
						)
							.then((order) => {
								console.log('order updated', order);
								return order;
							})
							.catch((err) => {
								console.log('order not updated err', err);
								return err;
							});
					};

					for (let group of orders) {
						let agentNum = agents.filter((agnt) => agnt._id === group._id)[0]
							.count;
						console.log('agentNum', agentNum);
						let agentObjects = agents.filter(
							(agnt) => agnt._id === group._id,
						)[0].agents;
						console.log('agentObjects', agentObjects);
						let orderAllocation = new Map();
						if (Config.GEOCODE_FOR_ORDERS_ALLOCATION) {
							let geoPoints = group.orders.map((order) => {
								setTimeout(() => {
									console.log('address to query', order.address.pincode);
								}, 2000);
								return geocode(order.address.pincode).then((res) => {
									return res;
								});
							});
							Promise.all(geoPoints).then((allGeoPoints) => {
								console.log('allGeoPoints', allGeoPoints);
								for (let gp of allGeoPoints) {
									console.log('Geopoint', gp);
								}
								clusterise(allGeoPoints, agentNum).then((res) => {
									console.log('geoPoint cluster', res);
								});
							});
						} else {
							let ordersSorted = group.orders.sort((o1, o2) => {
								return o1.address.pincode <= o2.address.pincode;
							});
							console.log('ordersSorted', ordersSorted);
							let totalOrders = ordersSorted.length;
							let ordersPerAgent = Math.ceil(totalOrders / agentNum);
							console.log('ordersPerAgent', ordersPerAgent);
							let orderInd = 0,
								agentInd = 0;
							while (orderInd < totalOrders && agentInd < agentNum) {
								orderAllocation.set(
									agentObjects[agentInd],
									ordersSorted.slice(orderInd, orderInd + ordersPerAgent),
								);
								orderInd += ordersPerAgent;
								agentInd += 1;
							}
							console.log('orderAllocation', orderAllocation);
						}
						let orderAllocationPromises = [];
						for (let key of orderAllocation.keys()) {
							let agentId = key._id;
							for (let ord of orderAllocation.get(key)) {
								orderAllocationPromises.push(
									updateOrderById(ord._id, { agent: ObjectId(agentId) }),
								);
							}
						}
						Promise.all(orderAllocationPromises).then(
							(allOrderAllocationPromises) => {
								allOrderAllocationPromises.forEach((orderPostAllocation) => {
									console.log('orderPostAllocation', orderPostAllocation);
								});
							},
						);
					}
				});
			}
		})
		.catch((err) => {
			console.log('Errors in orders find', err);
		});
};

exports.rescheduleOrders = (fromDay, toDay) => {
	var fromParam = new Date(fromDay);
	var from = new Date(
		fromParam.getFullYear(),
		fromParam.getMonth(),
		fromParam.getDate(),
		0,
		0,
		0,
		0,
	);
	console.log('from day', from);
	var tomorrow = new Date(from);
	tomorrow.setDate(from.getDate() + 1);
	console.log('tomorrow', tomorrow);
	Order.updateMany(
		{
			order_scheduled_date: {
				$gte: from,
				$lt: tomorrow,
			},
			status: 'PENDING',
		},
		{
			order_scheduled_date: toDay,
		},
	)
		.then((orders) => {
			if (orders) {
				console.log('Pending orders for today scheduled for tomorrow');
				console.log(orders);
			} else {
				console.log('No pending orders for today scheduled for tomorrow');
				console.log(orders);
			}
		})
		.catch((err) => {
			console.log('Pending orders for today scheduled for tomorrow, err', err);
		});
};

exports.initScheduledJobs = () => {
	const ordersAllocationFn = CronJob.schedule('0 0 0 * * ?', () => {
		let today = new Date();
		let yesterday = new Date();
		yesterday.setDate(today.getDate() - 1);
		console.log('=== ORDER RESCHEDULING BEGIN ===');
		this.rescheduleOrders(yesterday, today);
		console.log('=== ORDER RESCHEDULING END ===');
		console.log('=== ORDER ALLOCATION BEGIN ===');
		this.allocateOrders();
		console.log('=== ORDER ALLOCATION END ===');
		// Add your custom logic here
	});

	ordersAllocationFn.start();
};
