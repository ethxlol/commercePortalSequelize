require('dotenv').config();

const { TypePrice } = require('../models');

const typePricesData = [
	{
		user_type: 'retail',
		product_id: 1,
		price: 55.55,
	},
	{
		user_type: 'wholesale',
		product_id: 1,
		price: 15.55,
	},
];

module.exports = {
	up: async (queryInterface, Sequelize) => {
		await TypePrice.bulkCreate(typePricesData);
	},

	down: async (queryInterface, Sequelize) => {
		await TypePrice.destroy({ where: {} });
	},
};
