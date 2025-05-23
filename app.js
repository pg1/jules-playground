const fastify = require('fastify')({ logger: true }); // Initialize Fastify with logging
const db = require('./database.js'); // Ensures database is initialized
const userService = require('./userService.js');
const path = require('path');

// Register Fastify sensible for good defaults and error handling
fastify.register(require('@fastify/sensible'));

// Register Fastify static for serving static files
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/', // serve files from the root of the domain
});

// --- User API Routes ---

// Add a new user
fastify.post('/users', async (request, reply) => {
    const { username, email, password } = request.body;
    if (!username || !email || !password) {
        return reply.badRequest('Username, email, and password are required.');
    }
    try {
        const newUser = await userService.addUser(username, email, password);
        return reply.code(201).send(newUser);
    } catch (err) {
        fastify.log.error({ msg: "Error adding user", error: err.message, stack: err.stack });
        if (err.message.includes('UNIQUE constraint failed')) {
            return reply.conflict('Username or email already exists.');
        }
        return reply.internalServerError('Failed to add user.');
    }
});

// Get a user by ID
fastify.get('/users/:id', async (request, reply) => {
    const { id } = request.params;
    try {
        const user = await userService.getUserById(parseInt(id));
        if (user) {
            return reply.send(user);
        } else {
            return reply.notFound('User not found.');
        }
    } catch (err) {
        fastify.log.error({ msg: `Error getting user ${id}`, error: err.message, stack: err.stack });
        return reply.internalServerError('Failed to get user.');
    }
});

// Update a user
fastify.put('/users/:id', async (request, reply) => {
    const { id } = request.params;
    const { email, password } = request.body;

    if (!email && !password) {
        return reply.badRequest('Email or password is required for update.');
    }

    try {
        const result = await userService.updateUser(parseInt(id), { email, password });
        if (result) {
            return reply.send({ message: `User ${id} updated successfully.`, changes: result.changes });
        } else {
            return reply.notFound('User not found or no changes made.');
        }
    } catch (err) {
        fastify.log.error({ msg: `Error updating user ${id}`, error: err.message, stack: err.stack });
        if (err.message.includes('UNIQUE constraint failed')) {
            return reply.conflict('Email already exists.');
        }
        return reply.internalServerError('Failed to update user.');
    }
});

// Delete a user
fastify.delete('/users/:id', async (request, reply) => {
    const { id } = request.params;
    try {
        const result = await userService.deleteUser(parseInt(id));
        if (result) {
            return reply.send({ message: `User ${id} deleted successfully.`, deleted: result.deleted });
        } else {
            return reply.notFound('User not found.');
        }
    } catch (err) {
        fastify.log.error({ msg: `Error deleting user ${id}`, error: err.message, stack: err.stack });
        return reply.internalServerError('Failed to delete user.');
    }
});

// Basic test route
fastify.get('/test', async (request, reply) => {
  return reply.send({ ok: true });
});

// --- Server Start ---
const start = async () => {
    try {
        await fastify.listen({ port: 3000 });
        fastify.log.info(`Server listening on ${fastify.server.address().port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
