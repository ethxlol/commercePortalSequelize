const express = require('express');
const router = express.Router();

const { User } = require('../models');

router.get('/', async (req, res) => {
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

module.exports = router;
