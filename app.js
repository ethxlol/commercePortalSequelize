require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bcrypt = require('bcrypt');

const { sequelize, User, Product, TypePrice } = require('./models');
sequelize.sync();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// Route for user registration
app.post('/register', async (req, res) => {
	const { username, email, password, delivery_address } = req.body;
	if (!username || !email || !password || !delivery_address) {
		return res.status(400).send('Invalid input'); // Check for valid input
	}
	try {
		const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

		// Insert new user into the database using Sequelize
		await User.create({
			username,
			email,
			password: hashedPassword,
			delivery_address,
		});

		res.redirect('/login'); // Redirect to login after successful registration
	} catch (error) {
		console.error(error); // Log any errors during user creation
		res.status(500).send('Server error');
	}
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
