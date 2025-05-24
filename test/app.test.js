const assert = require('assert');
// Assuming app.ts compiles to dist/app.js and exports the fastify instance as default
const fastify = require('../dist/app.js').default;

async function runTest() {
    try {
        // Start the server on an available port
        await fastify.listen({ port: 0 });
        const port = fastify.server.address().port;

        // Make a request to the /test endpoint
        const response = await fetch(`http://localhost:${port}/test`);

        // Check the status code
        assert.strictEqual(response.status, 200, `Expected status 200, got ${response.status}`);

        // Check the response body
        const body = await response.json();
        assert.deepStrictEqual(body, { ok: true }, `Expected body { ok: true }, got ${JSON.stringify(body)}`);

        console.log('Test /test endpoint passed successfully!');

    } catch (err) {
        console.error('Test /test endpoint failed:', err);
        process.exitCode = 1; // Indicate test failure
    } finally {
        // Ensure the server is closed
        if (fastify && fastify.server && fastify.server.listening) {
            await fastify.close();
            console.log('Server closed.');
        }
    }
}

runTest();
