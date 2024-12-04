const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');  // Import node-cron for scheduling tasks
const app = express();
app.use(bodyParser.json());  // To parse JSON request bodies
// In-memory storage for menu items and orders
let menu = [];  // This will hold the menu items
let orders = [];  // This will hold the orders
// 1. Add Menu Item (POST /menu)
app.post('/menu', (req, res) => {
    const { name, price, category } = req.body;

    // Validate price
    if (price <= 0) {
        return res.status(400).json({ message: 'Price must be a positive number' });
    }

    // Validate category
    const validCategories = ['Pizza', 'Salad', 'Pasta'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ message: 'Invalid category' });
    }

    // Create new menu item
    const newItem = {
        id: menu.length + 1,  // Generate a simple ID based on array length
        name,
        price,
        category
    };

    // Add the item to the menu
    menu.push(newItem);

    // Send response back with the new menu item
    res.json({ message: 'Menu item added successfully', menuItem: newItem });
});
// 2. Get Menu (GET /menu)
app.get('/menu', (req, res) => {
    res.json(menu);  // Return the list of menu items
});
// 3. Place Order (POST /orders)
app.post('/orders', (req, res) => {
    const { items, customerName, address } = req.body;

    // Validate if all items exist in the menu
    const invalidItems = items.filter(itemId => !menu.find(item => item.id === itemId));
    if (invalidItems.length > 0) {
        return res.status(400).json({ message: `Invalid item IDs: ${invalidItems.join(', ')}` });
    }

    // Calculate the total price of the order
    const totalPrice = items.reduce((total, itemId) => {
        const item = menu.find(i => i.id === itemId);
        return total + item.price;
    }, 0);

    // Create a new order object
    const newOrder = {
        id: orders.length + 1,  // Generate a simple ID based on array length
        items,
        customerName,
        address,
        status: 'Preparing',  // Default order status
        totalPrice
    };

    // Add the order to the orders array
    orders.push(newOrder);

    // Send response with the created order
    res.json({ message: 'Order placed successfully', order: newOrder });
});
// 4. Get Order (GET /orders/:id)
app.get('/orders/:id', (req, res) => {
    const order = orders.find(o => o.id === parseInt(req.params.id)); // Find order by ID
    if (order) {
        res.json(order);  // If found, return the order details
    } else {
        res.status(404).json({ message: 'Order not found' });  // If not found, return 404
    }
});
// Automate order status updates (simulating status transitions)
cron.schedule('* * * * *', () => {
    orders.forEach(order => {
        if (order.status === 'Preparing') {
            order.status = 'Out for Delivery';
        } else if (order.status === 'Out for Delivery') {
            order.status = 'Delivered';
        }
    });
    console.log('Order statuses updated:', orders);
});
// Start the server
const PORT = process.env.PORT || 3001;  // Change to 3001 or another port
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

