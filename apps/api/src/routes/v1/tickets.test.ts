import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {registerTicketsRoutes} from './tickets.js';

async function build(perms: string[], authedAs: string | null, assignedUserId: string | null = null) {
    const app = Fastify();
    await registerTicketsRoutes(app, {
        authenticate: async () => authedAs,
        getPermissions: async () => perms,
        findTicketByChannelId: async (channelId) => channelId === 'c' ? {assignedUserId} : null,
    });
    return app;
}

type App = Awaited<ReturnType<typeof build>>;
const post = async (app: App, url: string, payload: object) =>
    (await app.inject({method: 'POST', url, payload})).statusCode;

for (const [url, payload, perm] of [
    ['/v1/tickets/assign', {ticketID: 1, assignmentID: 'someone'}, 'tickets.attribute'],
    ['/v1/tickets/transmission', {channelID: 'c', problematic: 'p', observations: 'o'}, 'tickets.transmission'],
] as const) {
    test(`${url}: 401 without authentication`, async () => {
        assert.equal(await post(await build([], null), url, payload), 401);
    });

    test(`${url}: 403 without ${perm}`, async () => {
        assert.equal(await post(await build(['tickets.close'], 'user1'), url, payload), 403);
    });
}

const find = (app: App, channelID: string) => post(app, '/v1/tickets/findBy/channelID', {channelID});

test('findBy: 401 without authentication', async () => {
    assert.equal(await find(await build([], null), 'c'), 401);
});

test('findBy: 403 without tickets.read_all, whether or not the ticket exists', async () => {
    const app = await build(['tickets.close'], 'user1', 'someone-else');
    assert.equal(await find(app, 'c'), 403);
    assert.equal(await find(app, 'missing'), 403);
});

test('findBy: 200 with tickets.read_all', async () => {
    assert.equal(await find(await build(['tickets.read_all'], 'user1'), 'c'), 200);
});

test('findBy: 200 for the assigned user', async () => {
    assert.equal(await find(await build([], 'user1', 'user1'), 'c'), 200);
});

test('findBy: numeric ID is not a fallback', async () => {
    assert.equal(await find(await build(['tickets.read_all'], 'user1'), '1'), 404);
});
