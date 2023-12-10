const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			console.error('Logout error: ', err);
			return res.status(500).send('Error while logging out');
		}
		res.redirect('/login');
	});
});

router.get('/', (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			return res.status(400).send('Unable to log out'); // Handle errors during logout
		}
		res.redirect('/'); // Redirect to home page after successful logout
	});
});

module.exports = router;
