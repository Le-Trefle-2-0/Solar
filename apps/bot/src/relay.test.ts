import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {MessageCreateOptions} from 'discord.js';
import {TicketRelay} from './relay.js';
import type {ActiveTicket, OpenResult, PendingMessage, ReactionState, SolarApi} from './solar.js';

const USER = '123456789012345678';
const links = {helpChannelId: '1', siteUrl: 'https://example.org', inviteUrl: 'https://example.org/discord'};
const quiet = {log: () => undefined, warn: () => undefined, error: () => undefined};
const ref = {ticketId: 42, channelId: 'chan42', reference: '00042'};

/** Fake Solar: open écoutes, pending volunteer messages, and what the bot told it. */
function fakeSolar(overrides: Partial<SolarApi> = {}) {
    const state = {
        active: [] as ActiveTicket[],
        pending: [] as PendingMessage[],
        relayed: [] as number[],
        undelivered: [] as number[],
        posted: [] as string[],
        replies: [] as (string | null)[],
        relayedAs: [] as (string | undefined)[],
        userReactions: [] as string[],
        reactionState: null as ReactionState | null,
        closed: [] as {channelId: string; withdraw: boolean}[],
        open: {kind: 'opened', ticket: ref, waitingAhead: 0} as OpenResult,
    };
    const api: SolarApi = {
        permanence: async () => ({open: true, closesAt: new Date(0).toISOString()}),
        activeTickets: async () => state.active,
        openTicket: async () => state.open,
        postUserMessage: async (_c, id, _content, replyTo) => {
            if (state.posted.includes(id)) return 'duplicate';
            state.posted.push(id);
            state.replies.push(replyTo ?? null);
            return 'saved';
        },
        pending: async (channelId) => state.active.some(t => t.channelId === channelId)
            ? state.pending.filter(m => !state.relayed.includes(m.id) && !state.undelivered.includes(m.id))
            : null,
        markRelayed: async (id, discordMessageId) => {
            state.relayed.push(id);
            state.relayedAs.push(discordMessageId);
        },
        userReaction: async (channelId, messageId, emoji, added) => void state.userReactions.push(`${channelId}:${messageId}:${added ? '+' : '-'}${emoji}`),
        reactionState: async () => state.reactionState,
        markUndelivered: async (id) => void state.undelivered.push(id),
        close: async (channelId, withdraw = false) => {
            state.closed.push({channelId, withdraw});
            return true;
        },
        ...overrides,
    };
    return {api, state};
}

type Outcome = 'sent' | 'unreachable';

function fakeDiscord(result: () => Outcome | Promise<Outcome> = () => 'sent') {
    const sent: {userId: string; text: string; id: string; replyTo?: string}[] = [];
    const synced: {messageId: string; emojis: string[]}[] = [];
    return {
        sent,
        synced,
        port: {
            sendDm: async (userId: string, payload: MessageCreateOptions) => {
                const r = await result();
                if (r === 'unreachable') return r;
                const embed = (payload.embeds?.[0] as {data?: {description?: string}} | undefined)?.data;
                const id = `d${sent.length + 1}`;
                sent.push({userId, text: embed?.description ?? '', id, replyTo: payload.reply?.messageReference as string | undefined});
                return {sent: id};
            },
            typing: async () => undefined,
            syncReactions: async (_userId: string, messageId: string, emojis: string[]) => void synced.push({messageId, emojis}),
        },
    };
}

const fakeRooms = () => {
    const followed = new Set<string>();
    return {followed, port: {listen: (c: string) => void followed.add(c), leave: (c: string) => void followed.delete(c)}};
};

test('opening: welcome message, room followed; busy notice when others wait', async () => {
    const {api, state} = fakeSolar();
    state.open = {kind: 'opened', ticket: ref, waitingAhead: 1};
    const discord = fakeDiscord();
    const rooms = fakeRooms();
    const relay = new TicketRelay(api, discord.port, rooms.port, links, quiet);

    assert.deepEqual(await relay.open(USER), {kind: 'opened', reference: '00042'});
    assert.match(discord.sent[0].text, /Bonsoir et bienvenue/);
    assert.match(discord.sent[1].text, /forte affluence/);
    assert.ok(rooms.followed.has('chan42'));
    assert.equal(relay.ticketOf(USER)?.reference, '00042');
});

test('opening with private messages closed: the empty écoute is withdrawn', async () => {
    const {api, state} = fakeSolar();
    const relay = new TicketRelay(api, fakeDiscord(() => 'unreachable').port, fakeRooms().port, links, quiet);
    assert.deepEqual(await relay.open(USER), {kind: 'dm_closed'});
    assert.deepEqual(state.closed, [{channelId: 'chan42', withdraw: true}]);
    assert.equal(relay.ticketOf(USER), null);
});

test('opening outside a permanence or twice is refused by Solar', async () => {
    const {api, state} = fakeSolar();
    const relay = new TicketRelay(api, fakeDiscord().port, fakeRooms().port, links, quiet);
    state.open = {kind: 'permanence_closed', nextOpening: null};
    assert.deepEqual(await relay.open(USER), {kind: 'permanence_closed', nextOpening: null});
    state.open = {kind: 'already_open', ticket: ref};
    assert.deepEqual(await relay.open(USER), {kind: 'already_open'});
});

test('user messages: relayed once, text only, nothing without an écoute', async () => {
    const {api, state} = fakeSolar();
    const relay = new TicketRelay(api, fakeDiscord().port, fakeRooms().port, links, quiet);
    assert.equal(await relay.onUserMessage(USER, {id: '1', content: 'Bonsoir', attachments: 0}), 'no_ticket');
    await relay.open(USER);
    assert.equal(await relay.onUserMessage(USER, {id: '1', content: 'Bonsoir', attachments: 0}), 'relayed');
    assert.equal(await relay.onUserMessage(USER, {id: '1', content: 'Bonsoir', attachments: 0}), 'duplicate');
    assert.equal(await relay.onUserMessage(USER, {id: '2', content: '', attachments: 1}), 'unsupported');
    assert.equal(await relay.onUserMessage(USER, {id: '3', content: 'Regarde', attachments: 1}), 'unsupported');
    assert.deepEqual(state.posted, ['1', '3']);
});

test('volunteer messages: delivered in order, marked, never twice; visitor echoes ignored', async () => {
    const {api, state} = fakeSolar();
    state.active = [{...ref, discordUserId: USER}];
    state.pending = [{id: 1, content: 'Bonsoir, je suis là', timestamp: 1}, {id: 2, content: 'Comment vas-tu ?', timestamp: 2}];
    const discord = fakeDiscord();
    const relay = new TicketRelay(api, discord.port, fakeRooms().port, links, quiet);
    await relay.resync();
    await relay.onSolarMessage('chan42', 'vol1');
    await relay.onSolarMessage('chan42', 'guest');
    assert.deepEqual(discord.sent.map(s => s.text), ['Bonsoir, je suis là', 'Comment vas-tu ?']);
    assert.deepEqual(state.relayed, [1, 2]);
    // Solar learns what each message became on Discord
    assert.deepEqual(state.relayedAs, ['d1', 'd2']);
});

test('replies: both ways, through the Discord messages', async () => {
    const {api, state} = fakeSolar();
    state.active = [{...ref, discordUserId: USER}];
    state.pending = [{id: 1, content: 'Tu parlais de ça ?', timestamp: 1, replyToDiscordId: '900'}];
    const discord = fakeDiscord();
    const relay = new TicketRelay(api, discord.port, fakeRooms().port, links, quiet);
    await relay.resync();
    assert.equal(discord.sent[0].replyTo, '900');

    await relay.onUserMessage(USER, {id: '901', content: 'Oui', attachments: 0, replyTo: 'd1'});
    await relay.onUserMessage(USER, {id: '902', content: 'Et aussi…', attachments: 0});
    assert.deepEqual(state.replies, ['d1', null]);
});

test('reactions: the user\'s go to Solar, the volunteers\' ones are mirrored on Discord', async () => {
    const {api, state} = fakeSolar();
    state.active = [{...ref, discordUserId: USER}];
    const discord = fakeDiscord();
    const relay = new TicketRelay(api, discord.port, fakeRooms().port, links, quiet);

    await relay.onUserReaction(USER, '901', '❤️', true);
    assert.deepEqual(state.userReactions, []);
    await relay.resync();
    await relay.onUserReaction(USER, '901', '❤️', true);
    await relay.onUserReaction(USER, '901', '❤️', false);
    assert.deepEqual(state.userReactions, ['chan42:901:+❤️', 'chan42:901:-❤️']);

    state.reactionState = {channelId: 'chan42', discordMessageId: '901', emojis: ['👍']};
    await relay.onSolarReaction(12);
    state.reactionState = {channelId: 'chan42', discordMessageId: '901', emojis: []};
    await relay.onSolarReaction(12);
    assert.deepEqual(discord.synced, [{messageId: '901', emojis: ['👍']}, {messageId: '901', emojis: []}]);

    // Not delivered on Discord, or another écoute: nothing to show
    state.reactionState = {channelId: 'chan42', discordMessageId: null, emojis: ['👍']};
    await relay.onSolarReaction(13);
    state.reactionState = {channelId: 'other', discordMessageId: '903', emojis: ['👍']};
    await relay.onSolarReaction(14);
    assert.equal(discord.synced.length, 2);
});

test('volunteer messages: a Discord outage keeps them for the next attempt', async () => {
    const {api, state} = fakeSolar();
    state.active = [{...ref, discordUserId: USER}];
    state.pending = [{id: 1, content: 'Bonsoir', timestamp: 1}];
    let down = true;
    const discord = fakeDiscord(() => {
        if (down) throw new Error('Discord unavailable');
        return 'sent';
    });
    const relay = new TicketRelay(api, discord.port, fakeRooms().port, links, quiet);
    await relay.resync();
    assert.deepEqual(state.relayed, []);
    down = false;
    await relay.resync();
    assert.deepEqual(state.relayed, [1]);
    assert.equal(discord.sent.length, 1);
});

test('volunteer messages: closed private messages are reported to Solar', async () => {
    const {api, state} = fakeSolar();
    state.active = [{...ref, discordUserId: USER}];
    state.pending = [{id: 5, content: 'Bonsoir', timestamp: 1}];
    const relay = new TicketRelay(api, fakeDiscord(() => 'unreachable').port, fakeRooms().port, links, quiet);
    await relay.resync();
    assert.deepEqual(state.undelivered, [5]);
});

test('closing: by the user (told once), by the volunteer (told), or while the bot was away', async () => {
    const {api, state} = fakeSolar();
    const discord = fakeDiscord();
    const rooms = fakeRooms();
    const relay = new TicketRelay(api, discord.port, rooms.port, links, quiet);
    await relay.open(USER);
    discord.sent.length = 0;

    assert.equal(await relay.closeByUser(USER), true);
    await relay.onTicketClosed('chan42', 'user');
    assert.deepEqual(discord.sent, []);
    assert.equal(rooms.followed.size, 0);
    assert.equal(await relay.closeByUser(USER), false);

    await relay.open(USER);
    discord.sent.length = 0;
    await relay.onTicketClosed('chan42', 'volunteer');
    assert.match(discord.sent[0].text, /fermé par le bénévole écoutant/);

    // Closed in Solar while the bot was disconnected: noticed at the next resync
    await relay.open(USER);
    discord.sent.length = 0;
    state.active = [];
    await relay.resync();
    assert.match(discord.sent[0].text, /fermé par le bénévole écoutant/);
    assert.equal(relay.size, 0);
});

test('restart: open écoutes are picked up from Solar', async () => {
    const {api, state} = fakeSolar();
    state.active = [{...ref, discordUserId: USER}];
    const rooms = fakeRooms();
    const relay = new TicketRelay(api, fakeDiscord().port, rooms.port, links, quiet);
    await relay.resync();
    assert.equal(relay.ticketOf(USER)?.channelId, 'chan42');
    assert.ok(rooms.followed.has('chan42'));
});

test('volunteer messages: sent but not recorded (Solar unreachable) is recorded later, not resent', async () => {
    let solarDown = true;
    const {api, state} = fakeSolar({
        markRelayed: async (id) => {
            if (solarDown) throw new Error('Solar unavailable');
            state.relayed.push(id);
        },
    });
    state.active = [{...ref, discordUserId: USER}];
    state.pending = [{id: 9, content: 'Bonsoir', timestamp: 1}];
    const discord = fakeDiscord();
    const relay = new TicketRelay(api, discord.port, fakeRooms().port, links, quiet);
    await relay.resync();
    solarDown = false;
    await relay.resync();
    assert.equal(discord.sent.length, 1);
    assert.deepEqual(state.relayed, [9]);
});
