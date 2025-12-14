import Fastify from 'fastify';
import cors from '@fastify/cors';
import {registerV1Routes} from './routes/v1/index';
import {API_HOST, API_PORT} from './env';

const app = Fastify({logger: true});

await app.register(cors, {origin: true, credentials: true});

// Health
app.get('/health', async () => ({status: 'ok'}));

// v1 routes (modular)
await registerV1Routes(app);

app
    .listen({port: API_PORT, host: API_HOST})
    .then(() => app.log.info(`API listening on http://${API_HOST}:${API_PORT}`))
    .catch((err) => {
        app.log.error(err);
        process.exit(1);
    });
