const { Agent } = require('../models/agent');

function getAgent(req, res, next) {
	if (req.session.userId) {
		Agent.findOne({ email: req.session.userId })
			.then((agent) => {
				if (agent) {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json(agent);
				} else {
					let err = new Error('Agent not found');
					err.statusCode = 404;
					next(err);
				}
			})
			.catch((err) => {
				console.log('err', err);
				let error = new Error(err);
				error.statusCode = 404;
				next(error);
			});
	} else {
		//code control shouldn't come here
		let err = new Error('You are not authenticated');
		err.statusCode = 403;
		next(err);
	}
}

function updateAgent(req, res, next) {
	Agent.findOneAndUpdate(
		{ email: req.session.userId },
		{ $set: req.body },
		{ new: true },
	)
		.then((agent) => {
			if (agent) {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json(agent);
			} else {
				let err = new Error('Agent not found');
				err.statusCode = 404;
				next(err);
			}
		})
		.catch((err) => {
			console.log('err', err);
			let error = new Error(err);
			error.statusCode = 500;
			next(error);
		});
}

module.exports = {
	getAgent,
	updateAgent,
};
