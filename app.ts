import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url'; // For ESM __dirname equivalent

// Import custom modules
import db from './database'; // Ensures database is initialized via side effects
import userService, { UserUpdateParams, NewUserParams } from './userService'; // Import service and types

// Import Fastify plugins
import sensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify: FastifyInstance = Fastify({ logger: true });

// Register Fastify sensible for good defaults and error handling
fastify.register(sensible);

// Register Fastify static for serving static files (e.g., for a future frontend)
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'), // __dirname is now correctly defined for ESM
  prefix: '/',
});

// --- Type definitions for request bodies/params if not using Fastify's schema validation ---
// Fastify can infer these from JSON schema, but explicit types are also good.

interface UserIdParam {
  id: string; // Params are strings by default
}

// --- User API Routes ---

// Add a new user
fastify.post<{ Body: NewUserParams }>(
  '/users',
  async (request: FastifyRequest<{ Body: NewUserParams }>, reply: FastifyReply) => {
    const { username, email, password } = request.body; // password is plain text from request.body
    // Basic validation, though Fastify's schema validation is better for production
    if (!username || !email || !password) {
      return reply.badRequest('Username, email, and password are required.');
    }
    try {
      const newUser = await userService.addUser(username, email, password);
      return reply.code(201).send(newUser);
    } catch (err: any) {
      fastify.log.error({ msg: "Error adding user", error: err.message, stack: err.stack });
      if (err.message.includes('UNIQUE constraint failed')) {
        return reply.conflict('Username or email already exists.');
      }
      return reply.internalServerError('Failed to add user.');
    }
  }
);

// Get a user by ID
fastify.get<{ Params: UserIdParam }>(
  '/users/:id',
  async (request: FastifyRequest<{ Params: UserIdParam }>, reply: FastifyReply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) {
        return reply.badRequest('User ID must be a number.');
    }
    try {
      const user = await userService.getUserById(id);
      if (user) {
        return reply.send(user);
      } else {
        return reply.notFound('User not found.');
      }
    } catch (err: any) {
      fastify.log.error({ msg: `Error getting user ${id}`, error: err.message, stack: err.stack });
      return reply.internalServerError('Failed to get user.');
    }
  }
);

// Update a user
fastify.put<{ Body: UserUpdateParams; Params: UserIdParam }>(
  '/users/:id',
  async (request: FastifyRequest<{ Body: UserUpdateParams; Params: UserIdParam }>, reply: FastifyReply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) {
        return reply.badRequest('User ID must be a number.');
    }
    const { email, password } = request.body;

    if (!email && !password) {
      return reply.badRequest('Email or password is required for update.');
    }

    try {
      const result = await userService.updateUser(id, { email, password });
      if (result) {
        return reply.send({ message: `User ${id} updated successfully.`, changes: result.changes });
      } else {
        return reply.notFound('User not found or no changes made.');
      }
    } catch (err: any) {
      fastify.log.error({ msg: `Error updating user ${id}`, error: err.message, stack: err.stack });
      if (err.message.includes('UNIQUE constraint failed')) {
        return reply.conflict('Email already exists.');
      }
      return reply.internalServerError('Failed to update user.');
    }
  }
);

// Delete a user
fastify.delete<{ Params: UserIdParam }>(
  '/users/:id',
  async (request: FastifyRequest<{ Params: UserIdParam }>, reply: FastifyReply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) {
        return reply.badRequest('User ID must be a number.');
    }
    try {
      const result = await userService.deleteUser(id);
      if (result) {
        return reply.send({ message: `User ${id} deleted successfully.`, deleted: result.deleted });
      } else {
        return reply.notFound('User not found.');
      }
    } catch (err: any) {
      fastify.log.error({ msg: `Error deleting user ${id}`, error: err.message, stack: err.stack });
      return reply.internalServerError('Failed to delete user.');
    }
  }
);

// Basic test route
fastify.get('/test', async (request: FastifyRequest, reply: FastifyReply) => {
  return reply.send({ ok: true });
});

// --- Server Start ---
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await fastify.listen({ port: port, host: '0.0.0.0' }); // Listen on all available IPs
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export default fastify; // Optional: export for testing or programmatic use
