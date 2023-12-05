module.exports = (sequelize, DataTypes) => {
	const Product = sequelize.define(
		'Product',
		{
			name: {
				type: DataTypes.STRING(100),
				allowNull: false,
			},
			description: {
				type: DataTypes.TEXT,
				allowNull: true, // Assuming description can be null
			},
			price: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
			quantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			image_url: {
				type: DataTypes.STRING(255),
				allowNull: true, // Assuming image_url can be null
			},
		},
		{
			// Additional model options
			timestamps: false, // Disable automatic timestamp fields if not needed
			tableName: 'products', // Specify the table name directly
		}
	);

	return Product;
};
