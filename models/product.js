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
			timestamps: false,
			tableName: 'products',
		}
	);

	// Add associations here
	Product.associate = (models) => {
		Product.hasMany(models.TypePrice, {
			foreignKey: 'product_id',
			as: 'typePrices',
		});
	};

	return Product;
};
