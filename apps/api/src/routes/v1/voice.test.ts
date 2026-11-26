import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {registerVoiceRoutes, type VoiceRouteDeps} from './voice.js';
import {authorizeVoice, type InternalVoiceDeps} from './internalVoice.js';
import {issueVoiceToken} from '../../lib/voiceToken.js';

const SECRET = 'voice-route-secret';
const NOW = 1_800_000_000_000;

type T = {id: number; channelId: string; statusName: string; voice: boolean; source: string; discordUserID: string; assignedUserId: string | null};
const tickets = (): Record<string, T> => ({
    web: {id: 1, channelId: 'web', statusName: 'started', voice: false, source: 'web', discordUserID: 'web:abc', assignedUserId: 'vol'},
    disc: {id: 2, channelId: 'disc', statusName: 'started', voice: false, source: 'discord', discordUserID: '123456789', assignedUserId: 'vol'},
    waiting: {id: 3, channelId: 'waiting', statusName: 'waiting', voice: false, source: 'web', discordUserID: 'web:x', assignedUserId: null},
    live: {id: 4, channelId: 'live', statusName: 'started', voice: true, source: 'web', discordUserID: 'web:y', assignedUserId: 'vol'},
});

async function setup(opts: {as?: string | null; perms?: string[]; write?: boolean; session?: string | null} = {}) {
    const db = tickets();
    const sent: {channelId: string; event: string; data: any; audience?: string}[] = [];
    const deps: VoiceRouteDeps = {
        authenticate: async () => (opts.as === undefined ? 'vol' : opts.as),
        getPermissions: async () => opts.perms ?? ['tickets.launch_voice', 'tickets.send_message'],
        canWrite: async () => opts.write ?? true,
        findTicket: async (c) => db[c] ?? null,
        setVoice: async (id) => {
            Object.values(db).find(t => t.id === id)!.voice = true;
        },
        endVoice: async (channelId) => {
            db[channelId].voice = false;
            sent.push({channelId, event: 'ticketVoice', data: {channelId, voice: false}});
        },
        readWidgetSession: () => (opts.session ? {channelId: opts.session} : null),
        notify: async (channelId, event, data, audience) => {
            sent.push({channelId, event, data, audience});
        },
        secret: () => SECRET,
        appUrl: 'https://solar.example',
        now: () => NOW,
        fetchRooms: async () => [
            {type: 'permanence', channelId: 'perm', participants: [{peerId: 'x', name: 'Alice', muted: false}]},
            {type: 'ticket', channelId: 'live', volunteer: true, visitor: true},
            {type: 'ticket', channelId: 'other', volunteer: true, visitor: false},
        ],
        findAssignedChannelIds: async (u) => (u === 'vol' ? ['live'] : []),
    };
    const app = Fastify();
    await registerVoiceRoutes(app, deps);
    return {app, db, sent};
}

test('voice ticket: only a volunteer with launch_voice and write access, on a ticket in progress', async () => {
    const post = async (s: Awaited<ReturnType<typeof setup>>, channelId: string) =>
        (await s.app.inject({method: 'POST', url: '/v1/voice/tickets', payload: {channelId}})).statusCode;
    assert.equal(await post(await setup({as: null}), 'web'), 401);
    assert.equal(await post(await setup({perms: ['tickets.send_message']}), 'web'), 403);
    assert.equal(await post(await setup({write: false}), 'web'), 403);
    assert.equal(await post(await setup(), 'waiting'), 409);
    assert.equal(await post(await setup(), 'nope'), 404);
});

test('voice ticket (website): marks the ticket and tells the widget, no bot link', async () => {
    const s = await setup();
    const res = await s.app.inject({method: 'POST', url: '/v1/voice/tickets', payload: {channelId: 'web'}});
    assert.equal(res.statusCode, 200);
    assert.equal(s.db.web.voice, true);
    assert.deepEqual(s.sent.map(e => [e.event, e.audience]), [['ticketVoice', undefined]]);
    assert.equal(res.json().link, null);
});

test('voice ticket (Discord): the bot gets a signed link for the Discord user', async () => {
    const s = await setup();
    const res = await s.app.inject({method: 'POST', url: '/v1/voice/tickets', payload: {channelId: 'disc'}});
    assert.equal(res.statusCode, 200);
    const invite = s.sent.find(e => e.event === 'voiceInvite')!;
    assert.equal(invite.audience, 'bots');
    assert.equal(invite.data.discordUserID, '123456789');
    assert.match(invite.data.url, /^https:\/\/solar\.example\/vocal\/disc\?e=\d+&t=[a-f0-9]{64}$/);
    assert.equal(res.json().link, invite.data.url);
});

test('widget: a voice token only for the visitor\'s own voice ticket', async () => {
    const post = async (session: string | null) => (await (await setup({session})).app.inject({method: 'POST', url: '/v1/widget/voice'}));
    assert.equal((await post(null)).statusCode, 401);
    assert.equal((await post('web')).statusCode, 409, 'not a voice ticket yet');
    const ok = await post('live');
    assert.equal(ok.statusCode, 200);
    assert.equal(ok.json().token.channelId, 'live');
});

test('public link check: valid only while the voice ticket is in progress', async () => {
    const s = await setup();
    const token = issueVoiceToken(SECRET, 'live', NOW);
    const check = async (q: string) => (await s.app.inject(`/v1/voice/link?${q}`)).json();
    assert.equal((await check(`c=live&e=${token.exp}&t=${token.t}`)).valid, true);
    assert.equal((await check(`c=web&e=${token.exp}&t=${token.t}`)).valid, false);
    s.db.live.statusName = 'closed';
    assert.deepEqual(await check(`c=live&e=${token.exp}&t=${token.t}`), {valid: false, ended: true});
});

// ---- who may join a voice room ----

function voiceDeps(over: Partial<InternalVoiceDeps> = {}): InternalVoiceDeps {
    return {
        isInternal: () => true,
        findUser: async (id) => (id === 'ghost' ? null : {id, name: id, displayUsername: null, banned: id === 'banned'}),
        getPermissions: async (id) => (id === 'rbe' ? ['tickets.read_all', 'tickets.send_message_all'] : ['tickets.launch_voice', 'tickets.send_message']),
        canWrite: async (id, c) => c === 'live' && id === 'vol',
        isPermanenceChannel: async (c) => c === 'perm',
        findTicket: async (c) => tickets()[c] ?? null,
        secret: () => SECRET,
        now: () => NOW,
        ...over,
    };
}

test('voice rooms: every member joins the permanence room, not a ticket room', async () => {
    const deps = voiceDeps();
    assert.equal((await authorizeVoice(deps, {room: {type: 'permanence', channelId: 'perm'}, userId: 'anyone'})).allowed, true);
    assert.equal((await authorizeVoice(deps, {room: {type: 'permanence', channelId: 'live'}, userId: 'anyone'})).allowed, false);
    assert.equal((await authorizeVoice(deps, {room: {type: 'permanence', channelId: 'perm'}, userId: 'banned'})).allowed, false);
    assert.equal((await authorizeVoice(deps, {room: {type: 'permanence', channelId: 'perm'}, token: issueVoiceToken(SECRET, 'perm', NOW)})).allowed, false);
});

test('voice rooms: a ticket call is the handling volunteer and the token holder only', async () => {
    const deps = voiceDeps();
    const room = {type: 'ticket', channelId: 'live'};
    const vol = await authorizeVoice(deps, {room, userId: 'vol'});
    assert.deepEqual(vol, {allowed: true, role: 'volunteer', userId: 'vol', name: 'vol'});
    // A supervisor without launch_voice sees the state but does not join
    assert.equal((await authorizeVoice(deps, {room, userId: 'rbe'})).allowed, false);
    assert.equal((await authorizeVoice(deps, {room, userId: 'other'})).allowed, false);
    const visitor = await authorizeVoice(deps, {room, token: issueVoiceToken(SECRET, 'live', NOW)});
    assert.deepEqual(visitor, {allowed: true, role: 'visitor', userId: null, name: 'Visiteur'});
    assert.equal((await authorizeVoice(deps, {room, token: issueVoiceToken(SECRET, 'web', NOW)})).allowed, false);
    // Not (or no longer) a voice ticket in progress
    assert.equal((await authorizeVoice(deps, {room: {type: 'ticket', channelId: 'web'}, userId: 'vol'})).allowed, false);
    assert.equal((await authorizeVoice(deps, {room: {type: 'ticket', channelId: '../x'}, userId: 'vol'})).allowed, false);
    assert.equal((await authorizeVoice(deps, {room})).allowed, false);
});

test('voice status: permanence rooms for all, ticket calls for supervisors and the assigned volunteer', async () => {
    const rooms = async (as: string, perms: string[]) =>
        ((await (await setup({as, perms})).app.inject('/v1/voice/status')).json().rooms as {channelId: string}[]).map(r => r.channelId);
    assert.deepEqual(await rooms('rbe', ['tickets.read_all']), ['perm', 'live', 'other']);
    assert.deepEqual(await rooms('vol', ['tickets.send_message']), ['perm', 'live']);
    assert.deepEqual(await rooms('someone', []), ['perm']);
    assert.equal((await (await setup({as: null})).app.inject('/v1/voice/status')).statusCode, 401);
});

test('end voice: the volunteer handling the écoute ends the call, the widget is told', async () => {
    const end = async (s: Awaited<ReturnType<typeof setup>>, channelId: string) =>
        (await s.app.inject({method: 'POST', url: '/v1/voice/tickets/end', payload: {channelId}})).statusCode;
    assert.equal(await end(await setup({as: null}), 'live'), 401);
    assert.equal(await end(await setup({perms: []}), 'live'), 403);
    assert.equal(await end(await setup({write: false}), 'live'), 403);
    const s = await setup();
    assert.equal(await end(s, 'live'), 200);
    assert.equal(s.db.live.voice, false);
    assert.deepEqual(s.sent.at(-1), {channelId: 'live', event: 'ticketVoice', data: {channelId: 'live', voice: false}});
});
