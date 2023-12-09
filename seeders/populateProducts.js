// Import your Sequelize model for the Product
const { Product } = require('../models');

// Define the data to insert
const productsData = [
	{
		name: 'Product 1',
		description: 'Description for Product 1',
		price: 19.99,
		quantity: 100,
		image_url: 'product1.jpg',
	},
	{
		name: 'Product 2',
		description: 'Description for Product 2',
		price: 29.99,
		quantity: 50,
		image_url: 'product2.jpg',
	},
	// Add more product objects as needed
];

// Define the seeder function
module.exports = {
	up: async (queryInterface, Sequelize) => {
		// Use Sequelize's bulkCreate to insert data into the products table
		await Product.bulkCreate(productsData);
	},

	down: async (queryInterface, Sequelize) => {
		// Remove the inserted data if needed (rollback)
		await Product.destroy({ where: {} });
	},
};
