const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
	res.render('confirmation'); // Render the order confirmation page
});

module.exports = router;
