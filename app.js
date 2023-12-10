console.log('Starting app.js');
require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
const session = require('express-session');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.EMAIL_USERNAME, // Email address for sending emails
		pass: process.env.EMAIL_PASSWORD, // Password for sending emails
	},
});

const { sequelize, User, Product, TypePrice } = require('./models');
sequelize
	.sync()
	.then(() => {
		console.log('Database connected');
	})
	.catch((error) => {
		console.error('Database connection error:', error);
	});

var app = express();

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

app.use(express.static(path.join(__dirname, 'public')));

app.use(
	session({
		secret: sessionSecretKey,
		resave: false,
		saveUninitialized: false,
	})
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/current-user', currentUserRouter);
app.use('/products-page', productPageRouter);
app.use('/products', productsRouter);
app.use('/logout', logoutRouter);
app.use('/cart', cartRouter);
app.use('/checkout', checkoutRouter);
// app.use('add-to-cart', cartRouter);
app.use('/confirmation', confirmationRouter);
app.use(cartRouter);

// Route for user registration

// Route for rendering the registration page

// Route for rendering the login page

// Route for getting the current user's username

// Route for fetching products with dynamic pricing based on user type

// Route for rendering the checkout page

// Route for serving the order confirmation page

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

// Setting up the server to listen on a specified port

module.exports = app;
