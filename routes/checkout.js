const express = require('express');
const router = express.Router();

const sequelize = require('sequelize');

const nodemailer = require('nodemailer');

const { User, Product } = require('../models');

// Configure nodemailer to use Gmail as SMTP server
const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.EMAIL_USERNAME,
		pass: process.env.EMAIL_PASSWORD,
	},
});

router.post('/', async (req, res) => {
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
			attributes: ['email', 'username', 'delivery_address', 'user_type'],
			where: { id: req.session.userId },
		});

		if (!user) {
			return res.status(404).send('User not found');
		}

		const {
			delivery_address: userDeliveryAddress,
			email: userEmail,
			username: userName,
			user_type: userType,
		} = user;

		// Retrieve product details using Sequelize based on items in the cart
		const productIds = req.session.cart.map((item) => item.productId);
		const products = await Product.findAll({
			attributes: [
				'id',
				'name',
				[
					sequelize.literal(`
              (SELECT COALESCE(
                  (SELECT price FROM type_prices WHERE product_id = Product.id AND user_type = '${userType}'),
                  Product.price
              ))`),
					'price',
				],
			],
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
			const productPrice = parseFloat(product ? product.get('price') : 0); // Using get('price') to fetch the aliased price
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

router.get('/', (req, res) => {
	if (req.session.userId) {
		res.render('checkout'); // Render the checkout page for logged-in users
	} else {
		res.redirect('/login'); // Redirect to login page if not logged in
	}
});

module.exports = router;
