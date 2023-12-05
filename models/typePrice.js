module.exports = (sequelize, DataTypes) => {
	const TypePrice = sequelize.define(
		'TypePrice',
		{
			user_type: {
				type: DataTypes.ENUM('retail', 'wholesale', 'bigclient'),
				allowNull: false,
			},
			product_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: {
					model: 'products', // Name of the model, if different than table name
					key: 'id',
				},
				onDelete: 'CASCADE',
			},
			price: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
		},
		{
			// Additional model options
			timestamps: false, // Disable automatic timestamp fields if not needed
			tableName: 'type_prices', // Specify the table name directly
		}
	);

	return TypePrice;
};
