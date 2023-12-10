const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
	if (req.session.userId) {
		res.render('products-page'); // Render the products page for logged-in users
	} else {
		res.redirect('/login'); // Redirect to login page if not logged in
	}
});

module.exports = router;
