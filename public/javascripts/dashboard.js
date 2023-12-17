// Event listener to show the "Add User" form
document
	.getElementById('showAddUserFormButton')
	.addEventListener('click', function () {
		document.getElementById('addUserForm').style.display = 'block';
	});

// Event listener to hide the "Add User" form when "Cancel" is clicked
document.getElementById('cancelAddUser').addEventListener('click', function () {
	document.getElementById('addUserForm').style.display = 'none';
});

// Add users to the database
document.getElementById('addUserForm').addEventListener('submit', function (e) {
	e.preventDefault();

	const formData = {
		username: document.getElementById('username').value,
		email: document.getElementById('email').value,
		password: document.getElementById('password').value,
		delivery_address: document.getElementById('delivery_address').value,
	};

	fetch('/dashboard/add-user', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(formData),
	})
		.then((response) => response.json())
		.then((data) => {
			// Hide the form and optionally clear the form fields after adding the user
			document.getElementById('addUserForm').style.display = 'none';
			document.getElementById('addUserForm').reset();
			// TODO: Update the users table with the new user data
		})
		.catch((error) => {
			// Handle errors here
		});
});

// Show the "Add Product" form
document
	.getElementById('showAddProductFormButton')
	.addEventListener('click', function () {
		document.getElementById('addProductForm').style.display = 'block';
	});

// Hide the "Add Product" form on cancel
document
	.getElementById('cancelAddProduct')
	.addEventListener('click', function () {
		document.getElementById('addProductForm').style.display = 'none';
	});

// Add products to the database
document
	.getElementById('addProductForm')
	.addEventListener('submit', function (e) {
		e.preventDefault();

		const formData = {
			name: document.getElementById('productName').value,
			description: document.getElementById('productDescription').value,
			price: document.getElementById('productPrice').value,
			quantity: document.getElementById('productQuantity').value,
			image_url: document.getElementById('productImageUrl').value,
		};

		fetch('/dashboard/add-product', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(formData),
		})
			.then((response) => response.json())
			.then((data) => {
				// Hide the form and optionally clear the form fields after adding the product
				document.getElementById('addProductForm').style.display = 'none';
				document.getElementById('addProductForm').reset();
				// TODO: Update the products table with the new product data
			})
			.catch((error) => {
				// Handle errors here
			});
	});
