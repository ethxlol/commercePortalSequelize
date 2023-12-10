const express = require('express');
const router = express.Router();

const { Product, TypePrice, User } = require('../models');
const sequelize = require('sequelize');

router.get('/', async (req, res) => {
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

router.get('/', (req, res) => {
	res.render('products');
});

module.exports = router;
