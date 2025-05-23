const express = require('express');
const app = express();
// Ensure database is initialized
const db = require('./database.js'); 
const userService = require('./userService.js');

app.use(express.json()); // Middleware to parse JSON bodies

// Add a new user
app.post('/users', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    try {
        const newUser = await userService.addUser(username, email, password);
        res.status(201).json(newUser);
    } catch (err) {
        console.error("Error adding user:", err);
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username or email already exists.' });
        }
        res.status(500).json({ error: 'Failed to add user.' });
    }
});

// Get a user by ID
app.get('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await userService.getUserById(parseInt(id));
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found.' });
        }
    } catch (err) {
        console.error(`Error getting user ${id}:`, err);
        res.status(500).json({ error: 'Failed to get user.' });
    }
});

// Update a user
app.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { email, password } = req.body;

    if (!email && !password) {
        return res.status(400).json({ error: 'Email or password is required for update.' });
    }

    try {
        const result = await userService.updateUser(parseInt(id), { email, password });
        if (result) {
            res.json({ message: `User ${id} updated successfully.`, changes: result.changes });
        } else {
            res.status(404).json({ error: 'User not found or no changes made.' });
        }
    } catch (err) {
        console.error(`Error updating user ${id}:`, err);
         if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Email already exists.' });
        }
        res.status(500).json({ error: 'Failed to update user.' });
    }
});

// Delete a user
app.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await userService.deleteUser(parseInt(id));
        if (result) {
            res.json({ message: `User ${id} deleted successfully.`, deleted: result.deleted });
        } else {
            res.status(404).json({ error: 'User not found.' });
        }
    } catch (err) {
        console.error(`Error deleting user ${id}:`, err);
        res.status(500).json({ error: 'Failed to delete user.' });
    }
});

app.get("/test", (req, res) => res.json({ ok: true }));

app.listen(3000, () => {
  console.log("Test started.");
});