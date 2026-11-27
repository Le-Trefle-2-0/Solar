import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import {registerKeysRoutes, KEY_USER_SELECT} from './keys.js';

process.env.INTERNAL_API_SECRET = 'internal-test-secret';
const internal = {authorization: 'Bearer internal-test-secret'};
const urls = ['/v1/keys/check', '/check-key'];

async function build() {
    const app = Fastify();
    await app.register(rateLimit, {global: false});
    await registerKeysRoutes(app, {
        findKey: async (key) => key === 'good' ? {id: 'k', enabled: true, expiresAt: null, userId: 'u'} : null,
        findUser: async () => ({id: 'u', name: 'U', email: 'u@example.com', role: 'bot', image: null}),
    });
    return app;
}

type App = Awaited<ReturnType<typeof build>>;
const check = (app: App, url: string, headers: Record<string, string> = {}) =>
    app.inject({method: 'POST', url, headers, payload: {key: 'good'}});

test('the user select never includes sensitive fields', () => {
    assert.deepEqual(Object.keys(KEY_USER_SELECT).sort(), ['email', 'id', 'image', 'name', 'role']);
});

for (const url of urls) {
    test(`${url}: 401 without the internal secret`, async () => {
        const app = await build();
        assert.equal((await check(app, url)).statusCode, 401);
        assert.equal((await check(app, url, {authorization: 'Bearer wrong'})).statusCode, 401);
    });

    test(`${url}: never returns the key value or user secrets`, async () => {
        const res = await check(await build(), url, internal);
        assert.equal(res.statusCode, 200);
        assert.doesNotMatch(res.body, /"good"|password|twoFactorSecret/);
    });

    test(`${url}: unauthenticated attempts are rate limited`, async () => {
        const app = await build();
        for (let i = 0; i < 5; i++) assert.equal((await check(app, url)).statusCode, 401);
        assert.equal((await check(app, url)).statusCode, 429);
    });

    test(`${url}: internal calls are not rate limited`, async () => {
        const app = await build();
        for (let i = 0; i < 20; i++) assert.equal((await check(app, url, internal)).statusCode, 200);
    });
}
