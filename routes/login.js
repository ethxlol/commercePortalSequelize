const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');

const { User } = require('../models');

router.get('/', (req, res, next) => {
	res.render('login'); // Render the login page
});

router.post('/', async (req, res) => {
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

module.exports = router;
