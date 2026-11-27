import Fastify from 'fastify';
import cors from '@fastify/cors';
import {allowedOrigins, isSameSiteRequest} from './lib/requestOrigin.js';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import rateLimit from '@fastify/rate-limit';
import {registerV1Routes} from './routes/v1/index.js';
import {API_HOST, API_PORT, assertRequiredSecrets} from './env.js';
import {startNewsletterScheduler} from './lib/scheduler.js';
import {startTeamDiscordSync} from './lib/teamDiscordSync.js';
import {seedDefaultRoles} from './lib/seed.js';
import {ensureBaseData} from './lib/baseData.js';
import {prisma} from './prisma.js';
import {redactUrl} from './lib/redact.js';
import {GLOBAL_RATE_LIMIT, trustProxySetting} from './lib/rateLimit.js';
import {errorHandler} from './lib/errors.js';

assertRequiredSecrets();

const app = Fastify({
    logger: {
        serializers: {
            req: (req) => ({method: req.method, url: redactUrl(req.url ?? ''), remoteAddress: req.ip}),
        },
    },
    // Needed behind a reverse proxy, otherwise every client shares the proxy's rate limit
    trustProxy: trustProxySetting(),
    // Larger bodies only where a route allows them (images, newsletters, team photos: #262)
    bodyLimit: 2 * 1024 * 1024
});

// Only the web app and API_CORS_ORIGIN, never any origin by default (#259)
const corsOriginList = allowedOrigins();
const corsOrigin = (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
    // No Origin: not a cross-origin browser request (server-to-server, same origin)
    if (!origin) return cb(null, true);
    return cb(null, isSameSiteRequest(origin, corsOriginList));
};

await app.register(cors, {origin: corsOrigin, credentials: true});
await app.register(cookie);
// Global limit; sensitive routes declare tighter ones
await app.register(rateLimit, GLOBAL_RATE_LIMIT);
app.setErrorHandler(errorHandler);
// The default handler logs the full URL, query string included
app.setNotFoundHandler((_req, reply) => reply.status(404).send({error: 'not_found'}));

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

// Rows the app needs (ticket statuses, public channel, #233), then the default roles
try {
    await ensureBaseData(prisma);
} catch (e) {
    console.error('[db] Error creating base data:', e);
}
await seedDefaultRoles();

// Start background tasks
startNewsletterScheduler();
// Team showcase: names and photos of people linked to Discord
startTeamDiscordSync();

app
    .listen({port: API_PORT, host: API_HOST})
    .then(() => app.log.info(`API listening on http://${API_HOST}:${API_PORT}`))
    .catch((err) => {
        app.log.error(err);
        process.exit(1);
    });
