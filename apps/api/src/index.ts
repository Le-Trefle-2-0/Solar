import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {registerV1Routes} from './routes/v1/index.js';
import {API_HOST, API_PORT} from './env.js';
import {startNewsletterScheduler} from './lib/scheduler.js';

const app = Fastify({
    logger: true,
    bodyLimit: 50 * 1024 * 1024 // 50MB
});

await app.register(cors, {origin: true, credentials: true});
await app.register(cookie);

await app.register(swagger, {
    openapi: {
        info: {
            title: 'Solar API',
            description: 'Internal API for Solar platform',
            version: '1.0.0',
        },
        servers: [
            {url: `http://${API_HOST}:${API_PORT}`}
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                apiKeyAuth: {
                    type: 'apiKey',
                    name: 'token',
                    in: 'header',
                },
                apiKeyQuery: {
                    type: 'apiKey',
                    name: 'token',
                    in: 'query',
                }
            }
        }
    }
});

await app.register(swaggerUi, {
    routePrefix: '/docs',
});

// Health
app.get('/health', async () => ({status: 'ok'}));

// v1 routes (modular)
await registerV1Routes(app);

// Start background tasks
startNewsletterScheduler();

app
    .listen({port: API_PORT, host: API_HOST})
    .then(() => app.log.info(`API listening on http://${API_HOST}:${API_PORT}`))
    .catch((err) => {
        app.log.error(err);
        process.exit(1);
    });
