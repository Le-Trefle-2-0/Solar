import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import {GLOBAL_RATE_LIMIT, limitPerMinute, trustProxySetting} from './rateLimit.js';

process.env.INTERNAL_API_SECRET = 'internal-test-secret';

async function build() {
    const app = Fastify();
    await app.register(rateLimit, GLOBAL_RATE_LIMIT);
    app.get('/normal', async () => 'ok');
    app.get('/sensitive', limitPerMinute(2), async () => 'ok');
    return app;
}

test('every route is limited, sensitive ones more tightly', async () => {
    const app = await build();
    const normal = await app.inject('/normal');
    assert.equal(normal.headers['x-ratelimit-limit'], '600');
    await app.inject('/sensitive');
    await app.inject('/sensitive');
    assert.equal((await app.inject('/sensitive')).statusCode, 429);
});

test('internal services are exempt', async () => {
    const app = await build();
    for (let i = 0; i < 5; i++) {
        const res = await app.inject({url: '/sensitive', headers: {authorization: 'Bearer internal-test-secret'}});
        assert.equal(res.statusCode, 200);
    }
});

test('proxy headers are not trusted unless configured', () => {
    assert.equal(trustProxySetting(''), false);
    assert.equal(trustProxySetting('1'), 1);
    assert.equal(trustProxySetting('10.0.0.1'), '10.0.0.1');
});
