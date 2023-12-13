const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { User } = require('../models');

router.post('/', async (req, res) => {
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

router.get('/', (req, res) => {
	res.render('register'); // Render the registration page
});

module.exports = router;
