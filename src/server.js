const http = require('http');
const mongoose = require('mongoose');

const app = require('./app');

const port = process.env.PORT || 3000;

const server = http.createServer(app);

console.log('Hello');
const url =
	'mongodb+srv://admin:gHPOl2iRtv6YmboK@cluster0.iisukc0.mongodb.net/alphaWasteDb?retryWrites=true&w=majority';
const connect = mongoose.connect(url);

connect.then(
	(db) => {
		console.log('Connected successfully to the db server');
	},
	(err) => {
		console.log(err);
	},
);

server.on('error', handleError);
server.listen(port);

console.log('Server listening on port', port);

function handleError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}
	switch (error.code) {
		case 'EACCES':
			console.error(`Port ${port} requires elevated privileges`);
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(`Port ${port} is already in use`);
			process.exit(1);
			break;
		default:
			throw error;
	}
}

module.exports = server; // for testing
