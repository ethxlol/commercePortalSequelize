module.exports = (sequelize, DataTypes) => {
	const TypePrice = sequelize.define(
		'TypePrice',
		{
			user_type: {
				type: DataTypes.STRING(255),
				allowNull: false,
			},
			product_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: {
					model: 'products',
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
			timestamps: false,
			tableName: 'type_prices',
		}
	);

	// Add associations here
	TypePrice.associate = (models) => {
		TypePrice.belongsTo(models.Product, {
			foreignKey: 'product_id',
			as: 'product',
		});
	};

	return TypePrice;
};
