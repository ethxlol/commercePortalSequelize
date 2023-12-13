const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const db = {};

// Use environment variables to initialize Sequelize
const sequelize = new Sequelize(
	process.env.DB_NAME, // Use the .env variable for the database name
	process.env.DB_USER, // Use the .env variable for the database username
	process.env.DB_PASS, // Use the .env variable for the database password
	{
		host: process.env.DB_HOST, // Use the .env variable for the database host
		dialect: 'mysql', // Assuming you're using MySQL
		// Add any other Sequelize options here
	}
);

// Read all the model files and initialize them
fs.readdirSync(__dirname)
	.filter((file) => {
		return (
			file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
		);
	})
	.forEach((file) => {
		const model = require(path.join(__dirname, file))(
			sequelize,
			Sequelize.DataTypes
		);
		db[model.name] = model;
	});

// Run .associate if it's defined on any of the models
Object.keys(db).forEach((modelName) => {
	if (db[modelName].associate) {
		db[modelName].associate(db);
	}
});

// Add the sequelize instance and Sequelize class to the db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
