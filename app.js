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

// app.use('/', indexRouter);
// app.use('/user', userRouter);
// app.use('/register', registerRouter);
// app.use('/login', loginRouter);
// app.use('/products', productsRouter);
// app.use('/cart-details', cartDetailsRouter);

app.get('/', (req, res) => {
	console.log('rendering index.ejs');
	res.render('index'); // Render the home page
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

app.post('/login', async (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).send('Invalid input');
	}

	try {
		// Find the user by username using Sequelize
		const user = await User.findOne({
			where: { username },
		});

		if (!user || !(await bcrypt.compare(password, user.password))) {
			return res.status(401).send('Invalid credentials');
		}

		// Store user ID in the session
		req.session.userId = user.id;

		res.redirect('/products-page');
	} catch (error) {
		console.error(error);
		res.status(500).send('Server error');
	}
});

app.post('/logout', (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			console.error('Logout error: ', err);
			return res.status(500).send('Error while logging out');
		}
		res.redirect('/login');
	});
});

app.post('/add-to-cart', async (req, res) => {
	const { productId, quantity } = req.body;
	if (!req.session.userId) {
		return res.status(401).send('User not logged in');
	}
	if (!req.session.cart) {
		req.session.cart = []; // Initialize the cart if it doesn't exist
	}

	try {
		// Fetch the user type, just like in the /products route
		const user = await User.findByPk(req.session.userId);
		if (!user) {
			return res.status(404).send('User not found');
		}

		// Fetch the correct price for the product, based on the user's type
		const product = await Product.findOne({
			attributes: [
				'id',
				'name',
				'description',
				'quantity',
				'image_url',
				[
					sequelize.literal(
						`COALESCE(
													(SELECT price FROM type_prices WHERE product_id = ${productId} AND user_type = '${user.user_type}'),
													Product.price
											)`
					),
					'price',
				],
			],
			where: { id: productId },
		});

		if (!product) {
			return res.status(404).send('Product not found');
		}

		const price = product.get('price'); // This should be the user-specific or default price

		// Check if the product is already in the cart
		const existingProductIndex = req.session.cart.findIndex(
			(item) => item.productId === productId
		);

		if (existingProductIndex >= 0) {
			// Update quantity if product already in cart
			req.session.cart[existingProductIndex].quantity += quantity;
		} else {
			// Add new product to the cart, including the price
			req.session.cart.push({ productId, quantity, price });
		}
		res.send('Product added to cart');
	} catch (error) {
		console.error('Error adding to cart:', error);
		res.status(500).send('Internal Server Error');
	}
});

// Route for removing an item from the cart
app.post('/remove-from-cart', (req, res) => {
	const { productId } = req.body;
	if (req.session.cart) {
		req.session.cart = req.session.cart.filter(
			(item) => item.productId !== parseInt(productId, 10)
		); // Remove the item from the cart
		res.send('Product removed from cart'); // Confirm removal from cart
	} else {
		res.status(400).send('Cart not found'); // Handle case where cart doesn't exist
	}
});

// Route for updating the cart
app.post('/update-cart', (req, res) => {
	const { productId, quantity } = req.body;
	if (!req.session.cart) {
		res.status(400).send('No cart found'); // Handle case where cart doesn't exist
	} else {
		const productIndex = req.session.cart.findIndex(
			(item) => item.productId === parseInt(productId, 10)
		);
		if (productIndex !== -1) {
			req.session.cart[productIndex].quantity = parseInt(quantity, 10); // Update the cart with new quantity
			res.send('Cart updated successfully'); // Confirm cart update
		} else {
			res.status(404).send('Product not found in cart'); // Handle case where product not in cart
		}
	}
});

app.post('/checkout', async (req, res) => {
	try {
		if (
			!req.session.userId ||
			!req.session.cart ||
			req.session.cart.length === 0
		) {
			return res.status(400).send('Cart is empty or user not logged in.'); // Validate user and cart existence
		}

		// Retrieve user details using Sequelize
		const user = await User.findOne({
			attributes: ['email', 'username', 'delivery_address'],
			where: { id: req.session.userId },
		});

		if (!user) {
			return res.status(404).send('User not found');
		}

		const {
			delivery_address: userDeliveryAddress,
			email: userEmail,
			username: userName,
		} = user;

		// Retrieve product details using Sequelize based on items in the cart
		const productIds = req.session.cart.map((item) => item.productId);
		const products = await Product.findAll({
			attributes: ['id', 'name', 'price'],
			where: { id: productIds },
		});

		// Construct email content with order details
		let emailMessageHtml = `<h1>Order Confirmation</h1>`;
		emailMessageHtml += `<p>User ID: ${req.session.userId}</p>`;
		emailMessageHtml += `<p>User Name: ${userName}</p>`;
		emailMessageHtml += `<p>Order Date & Time: ${new Date().toISOString()}</p>`;
		emailMessageHtml += `<p>Delivery Address: ${userDeliveryAddress}</p>`;
		emailMessageHtml += `<ul>`;

		let total = 0;
		req.session.cart.forEach((cartItem) => {
			const product = products.find((p) => p.id === cartItem.productId);
			const productPrice = parseFloat(product ? product.price : 0);
			const lineTotal = cartItem.quantity * productPrice;
			total += lineTotal;

			emailMessageHtml += `<li>${
				product ? product.name : 'Unknown Product'
			} - $${productPrice.toFixed(2)} x ${
				cartItem.quantity
			} = $${lineTotal.toFixed(2)}</li>`;
		});

		emailMessageHtml += `</ul>`;
		emailMessageHtml += `<p>Total: $${total.toFixed(2)}</p>`;

		// Define email options for sending to the customer
		const customerEmailOptions = {
			from: process.env.EMAIL_USERNAME,
			to: userEmail,
			subject: 'Order Confirmation',
			html: emailMessageHtml,
		};

		// Define email options for sending to the admin
		const adminEmailOptions = {
			from: process.env.EMAIL_USERNAME,
			to: process.env.ADMIN_EMAIL, // Admin's email address
			subject: `New Order from ${userName} (User ID: ${req.session.userId})`,
			html: emailMessageHtml,
		};

		// Send order confirmation email to the customer
		await transporter.sendMail(customerEmailOptions);

		// Send notification email to the admin
		await transporter.sendMail(adminEmailOptions);

		req.session.cart = []; // Clear the cart after successful order processing
		return res.send(
			'Thank you for your purchase! An order confirmation has been sent to your email.'
		);
	} catch (error) {
		console.error('Checkout error: ', error);
		return res.status(500).send('Internal Server Error'); // Handle server errors
	}
});

app.get('/logout', (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			return res.status(400).send('Unable to log out'); // Handle errors during logout
		}
		res.redirect('/'); // Redirect to home page after successful logout
	});
});

// Route for rendering the registration page
app.get('/register', (req, res) => {
	res.render('register'); // Render the registration page
});

// Route for rendering the login page
app.get('/login', (req, res) => {
	res.render('login'); // Render the login page
});

// Route for getting the current user's username
app.get('/current-user', async (req, res) => {
	if (req.session.userId) {
		try {
			// Fetch the current user's username using Sequelize
			const user = await User.findOne({
				attributes: ['username'],
				where: { id: req.session.userId },
			});

			if (user) {
				return res.json({ username: user.username });
			} else {
				return res.status(404).send('User not found');
			}
		} catch (error) {
			console.error('Error fetching user: ', error); // Log any errors
			return res.status(500).send('Internal Server Error'); // Handle server errors
		}
	} else {
		res.status(401).send('Not logged in'); // Handle scenario when the user is not logged in
	}
});

// Route for fetching products with dynamic pricing based on user type
app.get('/products', async (req, res) => {
	if (!req.session.userId) {
		return res.status(401).send('Please log in to view products');
	}

	try {
		const user = await User.findOne({
			attributes: ['user_type'],
			where: { id: req.session.userId },
		});

		if (!user) {
			return res.status(404).send('User not found');
		}

		const userType = user.user_type;

		// Query to fetch products with prices specific to user type
		const products = await Product.findAll({
			attributes: [
				'id',
				'name',
				'description',
				'quantity',
				'image_url',
				[
					sequelize.literal(
						'COALESCE(`typePrices`.`price`, `Product`.`price`)'
					),
					'price', // Use the correct alias here (typePrices)
				],
			],
			include: [
				{
					model: TypePrice,
					as: 'typePrices', // Use the correct alias here (typePrices)
					where: { user_type: userType },
					required: false,
				},
			],
		});

		res.json(products);
	} catch (error) {
		console.error(error);
		return res.status(500).send('Internal Server Error');
	}
});

app.get('/products-page', (req, res) => {
	if (req.session.userId) {
		res.render('products'); // Render the products page for logged-in users
	} else {
		res.redirect('/login'); // Redirect to login page if not logged in
	}
});

app.get('/cart-details', async (req, res) => {
	try {
		if (!req.session.cart || req.session.cart.length === 0) {
			return res.json([]); // Return empty array if cart is empty
		}

		const user = await User.findByPk(req.session.userId, {
			attributes: ['user_type'],
		});

		if (!user) {
			return res.status(404).send('User not found');
		}

		const userType = user.user_type;

		const productIds = req.session.cart.map((item) => item.productId);

		if (productIds.length === 0) {
			return res.json([]); // Return empty array if no product IDs are found
		}

		// Use Sequelize to fetch detailed information about products in the cart
		const products = await Product.findAll({
			attributes: [
				'id',
				'name',
				'description',
				'quantity',
				'image_url',
				[
					sequelize.literal(
						`COALESCE(
													(SELECT price FROM type_prices WHERE product_id = Product.id AND user_type = ${sequelize.escape(
														userType
													)}),
													Product.price
											)`
					),
					'price',
				],
			],
			where: { id: productIds },
		});

		// Map each cart item with additional product details
		const cartWithDetails = req.session.cart.map((cartItem) => {
			const product = products.find((p) => p.id === cartItem.productId);
			return {
				...cartItem,
				name: product ? product.name : 'Unknown',
				price: product ? product.get('price') : 0, // Ensure you get the correct price
				image_url: product ? product.image_url : 'path/to/default/image.jpg', // Add image_url if needed
			};
		});

		res.json(cartWithDetails); // Send detailed cart information to the client
	} catch (error) {
		console.error('Error fetching product details:', error); // Log any errors
		res.status(500).send('Error fetching product details'); // Handle server errors
	}
});

// Route for rendering the checkout page
app.get('/checkout', (req, res) => {
	if (req.session.userId) {
		res.render('checkout'); // Render the checkout page for logged-in users
	} else {
		res.redirect('/login'); // Redirect to login page if not logged in
	}
});

// Route for serving the order confirmation page
app.get('/confirmation', (req, res) => {
	res.render('confirmation'); // Render the order confirmation page
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

// Setting up the server to listen on a specified port

module.exports = app;
