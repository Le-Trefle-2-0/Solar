import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import {registerTicketsRoutes} from './tickets.js';
import {signWidgetSession} from '../../lib/widgetSession.js';

process.env.WS_GUEST_SECRET = 'test-secret';

/** Ticket ids written to by the routes under test. */
const writes: number[] = [];

async function build(perms: string[], authedAs: string | null, assignedUserId: string | null = null) {
    const app = Fastify();
    await app.register(cookie);
    await registerTicketsRoutes(app, {
        authenticate: async () => authedAs,
        getPermissions: async () => perms,
        findTicketByChannelId: async (channelId) => channelId === 'c' ? {assignedUserId} : null,
        findTicketById: async (id) => id === 1 ? {assignedUserId, channelId: 'c'} : null,
        updateTicket: async (id) => {
            writes.push(id);
            return {id};
        },
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

const edits = [
    ['/v1/tickets/update-categories', {ticketID: 1, categories: ['x']}],
    ['/v1/tickets/submit-feedback', {ticketID: 1, feedback: {age: '19-25'}}],
] as const;

for (const [url, payload] of edits) {
    test(`${url}: rejected without access to the ticket, nothing written`, async () => {
        writes.length = 0;
        assert.equal(await post(await build([], null), url, payload), 401);
        assert.equal(await post(await build(['tickets.close'], 'user1', 'someone-else'), url, payload), 403);
        assert.deepEqual(writes, []);
    });

    test(`${url}: allowed for the assigned user and tickets.read_all`, async () => {
        assert.equal(await post(await build([], 'user1', 'user1'), url, payload), 200);
        assert.equal(await post(await build(['tickets.read_all'], 'user1'), url, payload), 200);
    });
}

test('submit-feedback: a visitor may only rate their own ticket', async () => {
    const send = async (channelId: string) => {
        const exp = Date.now() + 60_000;
        return (await build([], null)).inject({
            method: 'POST', url: '/v1/tickets/submit-feedback', payload: edits[1][1],
            cookies: {
                widget_channel: channelId, widget_uid: 'guest_1', widget_exp: String(exp),
                widget_sig: signWidgetSession(channelId, 'guest_1', exp),
            },
        });
    };
    const own = await send('c');
    assert.equal(own.statusCode, 200);
    assert.deepEqual(own.json(), {success: true});
    assert.equal((await send('other')).statusCode, 401);
});

