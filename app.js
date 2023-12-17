console.log('Starting app.js');
// Load environment variables from .env file
require('dotenv').config();

// Import required modules
var createError = require('http-errors');
var express = require('express');
const session = require('express-session');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// Import Sequelize and database models
const { sequelize } = require('./models');

// Synchronize database models with the database
sequelize
	.sync()
	.then(() => {
		console.log('Database connected');
	})
	.catch((error) => {
		console.error('Database connection error:', error);
	});

// Create an Express application
var app = express();

// Define a session secret key or use a default key
const sessionSecretKey = process.env.SESSION_SECRET_KEY || 'default-secret-key';

// Routes
var indexRouter = require('./routes/index');
var registerRouter = require('./routes/register');
var loginRouter = require('./routes/login');
var currentUserRouter = require('./routes/current-user');
var productPageRouter = require('./routes/product-page');
var productsRouter = require('./routes/products');
var logoutRouter = require('./routes/logout');
var cartRouter = require('./routes/cart');
var checkoutRouter = require('./routes/checkout');
var confirmationRouter = require('./routes/confirmation');
var dashboardRouter = require('./routes/dashboard');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure Express to use sessions
app.use(
	session({
		secret: sessionSecretKey,
		resave: false,
		saveUninitialized: false,
	})
);

// Set up the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Use the morgan logger for HTTP request logging
app.use(logger('dev'));

// Parse incoming JSON requests
app.use(express.json());

// Parse incoming URL-encoded requests
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Use the defined routes
app.use('/', indexRouter);
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/current-user', currentUserRouter);
app.use('/products-page', productPageRouter);
app.use('/products', productsRouter);
app.use('/logout', logoutRouter);
app.use('/cart', cartRouter);
app.use('/checkout', checkoutRouter);
app.use('/confirmation', confirmationRouter);
app.use(cartRouter);
app.use(registerRouter);
app.use('/dashboard', dashboardRouter);
app.use('/add-user', dashboardRouter);
app.use('/add-product', dashboardRouter);

// Error handling middleware
app.use(function (err, req, res, next) {
	// Set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// Set the HTTP status code based on the error or default to 500 (Internal Server Error)
	res.status(err.status || 500);

	// Render the error page using the configured view engine (e.g., EJS)
	res.render('error');
});

// Export the Express application
module.exports = app;
