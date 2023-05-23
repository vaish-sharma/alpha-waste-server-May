const express = require('express');
const cors = require('cors');
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
var logger = require('morgan');
var path = require('path');

const indexRouter = require('./index.router');
const mainRouter = require('./main.router');
const usersRouter = require('./users.router');
const ordersRouter = require('./orders.router');
const agentRouter = require('./agent.router');
const productsRouter = require('./products.router');
const miscRouter = require('./misc.router');

const { rescheduleOrders } = require('./service/cron.job.service.js');

const app = express();
var corsOptions = {
	origin: true,
	credentials: true,
	optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.static('static'));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const store = new MongoDBStore(
	{
		uri:
			'mongodb+srv://admin:gHPOl2iRtv6YmboK@cluster0.iisukc0.mongodb.net/alphaWasteDb?retryWrites=true&w=majority',
		collection: 'sessions',
	},
	function (err) {
		console.log(err);
	},
);
store.on('error', function (err) {
	console.log(err);
});

const oneDay = 1000 * 60 * 60 * 24;
app.set('trust proxy', 1);
app.use(
	session({
		secret: 'keyboard cat',
		resave: false,
		saveUninitialized: false,
		store: store,
		name: 'alphaWaste',
		cookie: {
			secure: true,
			sameSite: 'none',
			maxAge: oneDay,
			//httpOnly: true
		},
	}),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
	logger(
		'=== REQUEST === :method :url :req[Authorization] :req[Cookie] :status :response-time ms - :res[content-length]',
	),
);

//Routes
//Log requests
app.use((req, res, next) => {
	console.log('=== REQUEST.SESSION ===', req.session);
	console.log('=== REQUEST.ROUTE ===', req.route);
	console.log('=== REQUEST.BODY ===', req.body);
	next();
});

app.get('/', (req, res, next) => {
	res.statusCode = 200;
	//Below line of code is just for testing
	//req.session.userId = 'userId';
	res.send('Welcome to the world');
	// allocateOrders()
	// 	.then((res) => console.log('res', res))
	// 	.catch((err) => console.log('err', err));
	// next();
});

app.use('/index', indexRouter);
app.use('/main', mainRouter);
app.use('/misc', miscRouter);

function auth(req, res, next) {
	console.log(req.session);
	// console.log('req.headers', req.headers);
	if (!req.session.userId) {
		console.log('no req.session.userId');
		var err = new Error('You are not authenticated!');
		err.status = 403;
		return next(err);
	} else {
		if (req.session.userId) {
			console.log('authenticated');
			next();
		} else {
			console.log('Hitting here!');
			err = new Error('You are not authenticated!');
			err.status = 403;
			return next(err);
		}
	}
}

//change this

app.use(auth);
app.use('/users', usersRouter);
app.use('/agent', agentRouter);
app.use('/orders', ordersRouter);
app.use('/products', productsRouter);

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
// 	next(createError(404));
// });

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	console.log('=== ERROR ===');
	console.error('error in ERROR HANDLER', err);
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	if (err.statusCode) {
		res.status(err.statusCode);
	} else if (err.status) {
		res.status(err.status);
	} else {
		res.status(500);
	}
	res.json({
		error: {
			status: res.statusCode,
			statusMessage: err.message,
		},
	});
});

module.exports = app;
