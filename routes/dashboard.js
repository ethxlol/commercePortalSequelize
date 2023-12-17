const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { User, Product } = require('../models');

// GET /dashboard
router.get('/', async (req, res, next) => {
	try {
		const users = await User.findAll();
		const products = await Product.findAll();
		res.render('dashboard', { users, products });
	} catch (err) {
		next(err);
	}
});

router.post('/add-user', async (req, res, next) => {
	try {
		const { username, email, password, delivery_address } = req.body;
		const hashedPassword = await bcrypt.hash(password, 8);

		const newUser = await User.create({
			username,
			email,
			password: hashedPassword,
			delivery_address,
		});

		res.json({
			success: true,
			message: 'User added successfully',
			user: newUser,
		});
	} catch (error) {
		res.json({
			success: false,
			message: 'Error adding user',
			error: error.message,
		});
	}
});

router.post('/add-product', async (req, res, next) => {
	try {
		const { name, description, price, quantity, image_url } = req.body;

		// Assuming your Product model matches these fields
		const newProduct = await Product.create({
			name,
			description,
			price,
			quantity,
			image_url,
		});

		res.json({
			success: true,
			message: 'Product added successfully',
			product: newProduct,
		});
	} catch (error) {
		res.json({
			success: false,
			message: 'Error adding product',
			error: error.message,
		});
	}
});
module.exports = router;
