// Import the framework and instantiate it
import Fastify from 'fastify'
import {EfrulFetchData} from './lib.js'

const fastify = Fastify({
    logger: true
})

// Declare a route
fastify.post('/', async function handler(request, reply) {
    return EfrulFetchData(request.body)
})

// Run the server!
try {
    await fastify.listen({port: 3000})
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}