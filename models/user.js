module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define(
		'User',
		{
			// Sequelize automatically generates an 'id' field by default.
			username: {
				type: DataTypes.STRING(50),
				allowNull: false,
			},
			email: {
				type: DataTypes.STRING(50),
				allowNull: false,
				unique: true,
			},
			password: {
				type: DataTypes.STRING(255),
				allowNull: false,
			},
			created_at: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
			},
			user_type: {
				type: DataTypes.ENUM('retail', 'wholesale', 'bigclient'),
				defaultValue: 'retail',
			},
			delivery_address: {
				type: DataTypes.STRING(255),
				allowNull: false,
			},
		},
		{
			// Additional model options
			timestamps: false, // Disable automatic timestamp fields (createdAt, updatedAt)
			tableName: 'users', // Specify the table name directly
		}
	);

	return User;
};
