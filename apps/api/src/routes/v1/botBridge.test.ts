import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {registerBotBridgeRoutes, type BotBridgeDeps, type BotTicket} from './botBridge.js';

const USER = '123456789012345678';
const ticket: BotTicket = {ticketId: 42, channelId: 'chan42', discordUserId: USER, createdAt: new Date(0)};

function build(overrides: Partial<BotBridgeDeps> = {}, as: string | null = 'bot_abc', perms = ['tickets.open']) {
    const calls: string[] = [];
    const stored = new Set<string>();
    const replies: (number | null)[] = [];
    // Message 7: a volunteer's, delivered as Discord message 3234…; 8: the user's (Discord 4234…)
    const reactions: {id: string; emoji: string; userID: string; messageID: number}[] = [
        {id: 'r1', emoji: '❤️', userID: 'vol', messageID: 8},
        {id: 'r2', emoji: '❤️', userID: 'vol2', messageID: 8},
        {id: 'r3', emoji: '👍', userID: 'bot_abc', messageID: 8},
    ];
    const deps: BotBridgeDeps = {
        authenticate: async () => as,
        getPermissions: async () => perms,
        permanence: async () => ({open: true, closesAt: '2026-11-27T22:00:00.000Z'}),
        discordSettings: async () => ({
            openingChannelId: '885276175696547890', openingMessageId: null, announceChannelId: null,
            helpChannelId: null,
        }),
        publishRequested: async () => true,
        openingMessagePublished: async (id) => void calls.push(`published:${id}`),
        activeTickets: async () => [ticket],
        findOpenTicketByChannel: async (id) => id === ticket.channelId ? ticket : null,
        findOpenTicketByUser: async () => null,
        createTicket: async () => {
            calls.push('create');
            return ticket;
        },
        countWaiting: async () => 2,
        saveUserMessage: async (_t, discordMessageId, _content, replyID) => {
            if (stored.has(discordMessageId)) return null;
            replies.push(replyID);
            stored.add(discordMessageId);
            return {id: stored.size, createdAt: new Date(1)};
        },
        pendingMessages: async () => [{id: 7, content: 'Bonsoir', createdAt: new Date(2), replyToDiscordId: '423456789012345678'}],
        findMessage: async (id) => id === 7 ? {id, channelId: ticket.channelId, userId: 'vol', discordID: '323456789012345678'}
            : id === 8 ? {id, channelId: ticket.channelId, userId: null, discordID: '423456789012345678'} : null,
        findByDiscordId: async (channelId, discordMessageId) => channelId !== ticket.channelId ? null
            : discordMessageId === '323456789012345678' ? {id: 7} : discordMessageId === '423456789012345678' ? {id: 8} : null,
        markRelayed: async (id, failed, discordMessageId) => void calls.push(`${failed ? 'failed' : 'relayed'}:${id}${discordMessageId ? `:${discordMessageId}` : ''}`),
        reactionsOf: async (messageId) => reactions.filter(r => r.messageID === messageId),
        addReaction: async (messageID, userID, emoji) => {
            const reaction = {id: `r${reactions.length + 1}`, emoji, userID, messageID};
            reactions.push(reaction);
            return reaction;
        },
        removeReaction: async (id) => {
            reactions.splice(reactions.findIndex(r => r.id === id), 1);
        },
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
    return {app, calls, replies, reactions};
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
    assert.equal(res.json().publishOpeningMessage, true);
});

test('settings: the bot reports the opening message it posted', async () => {
    const {app, calls} = build();
    const post = (messageId: unknown) => app.inject({method: 'POST', url: '/v1/bot/settings/opening-message', payload: {messageId}});
    assert.equal((await post('not-an-id')).statusCode, 400);
    assert.equal((await post('885276306223276052')).statusCode, 200);
    assert.deepEqual(calls, ['published:885276306223276052']);
    // Volunteers cannot set it
    const volunteer = build({}, 'user1', ['admin.sudo']).app;
    assert.equal((await volunteer.inject({method: 'POST', url: '/v1/bot/settings/opening-message', payload: {messageId: '885276306223276052'}})).statusCode, 403);
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
    assert.deepEqual(pending.json(), {messages: [{id: 7, content: 'Bonsoir', timestamp: 2, replyToDiscordId: '423456789012345678'}]});
    // The Discord message it became is kept, for replies and reactions
    assert.equal((await app.inject({method: 'POST', url: '/v1/bot/messages/7/relayed', payload: {discordMessageId: '323456789012345678'}})).statusCode, 200);
    assert.equal((await app.inject({method: 'POST', url: '/v1/bot/messages/7/undelivered'})).statusCode, 200);
    assert.equal((await app.inject({method: 'POST', url: '/v1/bot/messages/8/relayed'})).statusCode, 404);
    assert.equal((await app.inject({method: 'POST', url: '/v1/bot/messages/x/relayed'})).statusCode, 404);
    assert.deepEqual(calls, ['relayed:7:323456789012345678', 'failed:7', 'notify:messageUndelivered']);
});

test('replies from Discord: linked to the answered message when Solar knows it', async () => {
    const {app, replies} = build();
    const send = (id: string, replyToDiscordId?: string) => app.inject({
        method: 'POST', url: '/v1/bot/tickets/chan42/messages',
        payload: {discordMessageId: id, content: 'Oui', ...(replyToDiscordId ? {replyToDiscordId} : {})},
    });
    const answer = await send('523456789012345678', '323456789012345678');
    assert.equal(answer.statusCode, 201);
    // A reply to a message from before the écoute: a plain message
    await send('623456789012345678', '999456789012345678');
    await send('723456789012345678');
    assert.deepEqual(replies, [7, null, null]);
    assert.equal((await send('823456789012345678', 'nope')).statusCode, 400);
});

test('reactions from Discord: stored once under the bot, taken back, server emojis refused', async () => {
    const {app, calls, reactions} = build();
    const react = (emoji: string, added: boolean, discordMessageId = '323456789012345678') =>
        app.inject({method: 'POST', url: '/v1/bot/tickets/chan42/reactions', payload: {discordMessageId, emoji, added}});

    assert.equal((await react('🙏', true)).statusCode, 200);
    assert.equal((await react('🙏', true)).statusCode, 200);
    assert.deepEqual(reactions.filter(r => r.messageID === 7).map(r => [r.emoji, r.userID]), [['🙏', 'bot_abc']]);
    await react('🙏', false);
    assert.equal(reactions.filter(r => r.messageID === 7).length, 0);
    assert.deepEqual(calls, ['notify:reactionAdd', 'notify:reactionRemove']);

    assert.equal((await react('<:trefle:123456789012345678>', true)).statusCode, 400);
    assert.equal((await react('🙏', true, '999456789012345678')).statusCode, 404);
    const volunteer = build({}, 'user1', ['admin.sudo']).app;
    assert.equal((await volunteer.inject({method: 'POST', url: '/v1/bot/tickets/chan42/reactions', payload: {discordMessageId: '323456789012345678', emoji: '🙏', added: true}})).statusCode, 403);
});

test('reactions for Discord: the volunteers\' emojis, without the user\'s own', async () => {
    const {app} = build();
    const res = await app.inject('/v1/bot/messages/8/reactions');
    assert.deepEqual(res.json(), {channelId: 'chan42', discordMessageId: '423456789012345678', emojis: ['❤️']});
    assert.equal((await app.inject('/v1/bot/messages/99/reactions')).statusCode, 404);
});

test('closing by the user: only an open écoute', async () => {
    const {app, calls} = build();
    assert.equal((await app.inject({method: 'POST', url: '/v1/bot/tickets/chan42/close'})).statusCode, 200);
    assert.equal((await app.inject({method: 'POST', url: '/v1/bot/tickets/gone/close'})).statusCode, 404);
    const withdrawn = await app.inject({method: 'POST', url: '/v1/bot/tickets/chan42/close', payload: {withdraw: true}});
    assert.deepEqual(withdrawn.json(), {success: true, withdrawn: true});
    assert.deepEqual(calls, ['close', 'withdraw', 'notify:updateRequest']);
});
