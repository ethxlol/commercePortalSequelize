const express = require('express');
const router = express.Router();

const { sequelize } = require('../models');
const { User, Product } = require('../models');

router.post('/add-to-cart', async (req, res) => {
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
router.post('/', (req, res) => {
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
router.post('/update-cart', (req, res) => {
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

router.get('/cart-details', async (req, res) => {
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

module.exports = router;
