import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {registerBotBridgeRoutes, type BotBridgeDeps, type BotTicket} from './botBridge.js';

const USER = '123456789012345678';
const ticket: BotTicket = {ticketId: 42, channelId: 'chan42', discordUserId: USER, createdAt: new Date(0)};

function build(overrides: Partial<BotBridgeDeps> = {}, as: string | null = 'bot_abc', perms = ['tickets.open']) {
    const calls: string[] = [];
    const stored = new Set<string>();
    const deps: BotBridgeDeps = {
        authenticate: async () => as,
        getPermissions: async () => perms,
        permanence: async () => ({open: true, closesAt: '2026-11-27T22:00:00.000Z'}),
        discordSettings: async () => ({
            openingChannelId: '885276175696547890', openingMessageId: null, announceChannelId: null,
            voiceChannelId: null, helpChannelId: null,
        }),
        activeTickets: async () => [ticket],
        findOpenTicketByChannel: async (id) => id === ticket.channelId ? ticket : null,
        findOpenTicketByUser: async () => null,
        createTicket: async () => {
            calls.push('create');
            return ticket;
        },
        countWaiting: async () => 2,
        saveUserMessage: async (_t, discordMessageId) => {
            if (stored.has(discordMessageId)) return null;
            stored.add(discordMessageId);
            return {id: stored.size, createdAt: new Date(1)};
        },
        pendingMessages: async () => [{id: 7, content: 'Bonsoir', createdAt: new Date(2)}],
        findMessage: async (id) => id === 7 ? {id, channelId: ticket.channelId, userId: 'vol'} : id === 8 ? {id, channelId: ticket.channelId, userId: null} : null,
        markRelayed: async (id, failed) => void calls.push(`${failed ? 'failed' : 'relayed'}:${id}`),
        close: async () => void calls.push('close'),
        withdraw: async () => {
            calls.push('withdraw');
            return true;
        },
        notify: async (_room, event) => void calls.push(`notify:${event}`),
        ...overrides,
    };
    const app = Fastify();
    registerBotBridgeRoutes(app, deps);
    return {app, calls};
}

test('bot routes: only the bot account with its key', async () => {
    assert.equal((await build({}, null).app.inject('/v1/bot/permanence')).statusCode, 401);
    // A volunteer, even one holding every permission, is not the bot
    assert.equal((await build({}, 'user1', ['admin.sudo']).app.inject('/v1/bot/permanence')).statusCode, 403);
    assert.equal((await build({}, 'bot_abc', []).app.inject('/v1/bot/permanence')).statusCode, 403);
    assert.equal((await build().app.inject('/v1/bot/permanence')).statusCode, 200);
    assert.equal((await build({}, 'user1', ['admin.sudo']).app.inject('/v1/bot/settings')).statusCode, 403);
});

test('settings: the channels set in Solar', async () => {
    const res = await build().app.inject('/v1/bot/settings');
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().discord.openingChannelId, '885276175696547890');
    assert.equal(res.json().discord.openingMessageId, null);
});

test('opening: one écoute per person, only during a permanence', async () => {
    const open = (deps: Partial<BotBridgeDeps>, body: object = {discordUserId: USER}) =>
        build(deps).app.inject({method: 'POST', url: '/v1/bot/tickets', payload: body});

    assert.equal((await open({}, {discordUserId: 'not-an-id'})).statusCode, 400);
    const already = await open({findOpenTicketByUser: async () => ticket});
    assert.equal(already.statusCode, 409);
    assert.equal(already.json().ticket.reference, '00042');

    const closed = await open({permanence: async () => ({open: false, nextOpening: {start: 's', end: 'e'}})});
    assert.equal(closed.statusCode, 403);
    assert.deepEqual(closed.json(), {error: 'permanence_closed', nextOpening: {start: 's', end: 'e'}});

    const {app, calls} = build();
    const created = await app.inject({method: 'POST', url: '/v1/bot/tickets', payload: {discordUserId: USER}});
    assert.equal(created.statusCode, 201);
    assert.deepEqual(created.json(), {ticket: {ticketId: 42, channelId: 'chan42', reference: '00042'}, waitingAhead: 2});
    assert.deepEqual(calls, ['create', 'notify:updateRequest']);
});

test('user messages: stored once per Discord message, refused once the écoute is closed', async () => {
    const {app, calls} = build();
    const send = (url = '/v1/bot/tickets/chan42/messages') =>
        app.inject({method: 'POST', url, payload: {discordMessageId: '223456789012345678', content: 'Bonsoir'}});
    assert.equal((await send()).statusCode, 201);
    assert.deepEqual((await send()).json(), {duplicate: true});
    assert.deepEqual(calls, ['notify:message']);
    assert.equal((await send('/v1/bot/tickets/other/messages')).statusCode, 404);
});

test('volunteer messages: pending list, delivered or undelivered, never a visitor message', async () => {
    const {app, calls} = build();
    const pending = await app.inject('/v1/bot/tickets/chan42/pending');
    assert.deepEqual(pending.json(), {messages: [{id: 7, content: 'Bonsoir', timestamp: 2}]});
    assert.equal((await app.inject({method: 'POST', url: '/v1/bot/messages/7/relayed'})).statusCode, 200);
    assert.equal((await app.inject({method: 'POST', url: '/v1/bot/messages/7/undelivered'})).statusCode, 200);
    assert.equal((await app.inject({method: 'POST', url: '/v1/bot/messages/8/relayed'})).statusCode, 404);
    assert.equal((await app.inject({method: 'POST', url: '/v1/bot/messages/x/relayed'})).statusCode, 404);
    assert.deepEqual(calls, ['relayed:7', 'failed:7', 'notify:messageUndelivered']);
});

test('closing by the user: only an open écoute', async () => {
    const {app, calls} = build();
    assert.equal((await app.inject({method: 'POST', url: '/v1/bot/tickets/chan42/close'})).statusCode, 200);
    assert.equal((await app.inject({method: 'POST', url: '/v1/bot/tickets/gone/close'})).statusCode, 404);
    const withdrawn = await app.inject({method: 'POST', url: '/v1/bot/tickets/chan42/close', payload: {withdraw: true}});
    assert.deepEqual(withdrawn.json(), {success: true, withdrawn: true});
    assert.deepEqual(calls, ['close', 'withdraw', 'notify:updateRequest']);
});
