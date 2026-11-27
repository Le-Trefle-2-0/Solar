import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {registerEventsRoutes} from './events.js';

async function build(permissions: string[], authedAs: string | null = 'user1') {
    const app = Fastify();
    await registerEventsRoutes(app, {
        authenticate: async () => authedAs,
        getActor: async (id) => ({id, roles: ['Bénévole Écoutant'], permissions}),
    });
    return app;
}

const slots = [{role: 'Bénévole Écoutant', goalCount: 3, part: 'first'}];
const event = {title: 'Permanence', start: '2026-12-03T19:00:00Z', end: '2026-12-03T22:00:00Z', roleSlots: slots};

test('editing a permanence: 401 signed out, 403 without permanence.open (#221)', async () => {
    const put = (app: Awaited<ReturnType<typeof build>>) =>
        app.inject({method: 'PUT', url: '/v1/events/e1', payload: {start: '2026-12-03T18:00:00Z'}});
    assert.equal((await put(await build([], null))).statusCode, 401);
    assert.equal((await put(await build(['permanence.register', 'permanence.close']))).statusCode, 403);
});

test('creating a permanence: 403 without permanence.open, 400 when it ends before it starts', async () => {
    const post = async (perms: string[], payload: object) =>
        (await (await build(perms)).inject({method: 'POST', url: '/v1/events', payload})).statusCode;
    assert.equal(await post(['permanence.register'], event), 403);
    assert.equal(await post(['permanence.open'], {...event, end: '2026-12-03T18:00:00Z'}), 400);
    assert.equal(await post(['permanence.open'], {...event, roleSlots: []}), 400);
});

test('deleting a permanence: 403 without permanence.close', async () => {
    const res = await (await build(['permanence.open'])).inject({method: 'DELETE', url: '/v1/events/e1'});
    assert.equal(res.statusCode, 403);
});

test('registration routes: 401 signed out, 400 on malformed bodies', async () => {
    const signedOut = await build([], null);
    for (const url of ['/v1/events/e1/register', '/v1/events/e1/unregister', '/v1/events/registrations/r1/status']) {
        assert.equal((await signedOut.inject({method: 'POST', url, payload: {}})).statusCode, 401);
    }
    const app = await build(['permanence.register']);
    assert.equal((await app.inject({method: 'POST', url: '/v1/events/e1/register', payload: {part: 'third'}})).statusCode, 400);
    assert.equal((await app.inject({method: 'POST', url: '/v1/events/registrations/r1/status', payload: {status: 'deleted'}})).statusCode, 400);
});
