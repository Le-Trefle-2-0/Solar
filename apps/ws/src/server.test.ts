import {after, before, test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type {AddressInfo} from 'node:net';
import {io as connect, type Socket as ClientSocket} from 'socket.io-client';
import {createWsServer, signGuest, type WsSession} from './server.js';

const SECRETS = {guest: 'guest-secret', broadcast: 'broadcast-secret', internal: 'internal-secret'};

// Fake API: "vol" is assigned to channel c1, "reader" may read every ticket, "other" has nothing.
const sessions: Record<string, WsSession> = {
    vol: {user: {id: 'vol', username: 'Vol', image: null, role: 'Bénévole Écoutant'}, readAll: false, channels: ['1', 'c1']},
    reader: {user: {id: 'reader', username: 'Reader', image: null, role: 'Référent'}, readAll: true, channels: ['1']},
    other: {user: {id: 'other', username: 'Other', image: null, role: 'Bénévole Écoutant'}, readAll: false, channels: ['1']},
    solo: {user: {id: 'solo', username: 'Solo', image: null, role: 'Bénévole Écoutant'}, readAll: false, channels: ['1']},
};
const access = (userId: string, channelId: string) => {
    if (channelId === '1') return {read: true, write: true};
    if (userId === 'reader' || userId === 'bot-user') return {read: true, write: false};
    if (userId === 'vol' && channelId === 'c1') return {read: true, write: true};
    return {read: false, write: false};
};

/** Bot keys the fake API still accepts. */
const validKeys = new Set(['bot-key', 'bot-key-2']);

let base = '';
let close: () => Promise<void>;
const quiet = {log: () => undefined, warn: () => undefined, error: () => undefined};

before(async () => {
    const {httpServer, io} = createWsServer({
        verifyJwt: async (t) => (t.startsWith('jwt-') ? {sub: t.slice(4)} : null),
        checkApiKey: async (k) => (validKeys.has(k) ? {userId: 'bot-user'} : null),
        getSession: async (id) => sessions[id] ?? null,
        getChannelAccess: async (u, c) => access(u, c),
        secrets: SECRETS,
        log: quiet,
    });
    await new Promise<void>(r => httpServer.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
    close = () => new Promise(r => {
        io.close();
        httpServer.close(() => r());
    });
});

after(async () => close());

const clients: ClientSocket[] = [];
after(() => clients.forEach(c => c.disconnect()));

function client(auth: Record<string, unknown>): Promise<ClientSocket> {
    return new Promise((resolve, reject) => {
        const c = connect(base, {auth, transports: ['websocket'], forceNew: true, reconnection: false});
        clients.push(c);
        c.once('connect', () => resolve(c));
        c.once('connect_error', reject);
    });
}

const ack = <T = unknown>(c: ClientSocket, event: string, ...args: unknown[]) =>
    new Promise<T>(r => c.emit(event, ...args, (v: T) => r(v)));

/** Collects what a client receives for `event` during `ms`. */
function collect(c: ClientSocket, event: string, ms = 150) {
    const got: any[] = [];
    const h = (d: any) => got.push(d);
    c.on(event, h);
    return new Promise<any[]>(r => setTimeout(() => {
        c.off(event, h);
        r(got);
    }, ms));
}

async function broadcast(room: string | null, event: string, data: unknown, secret = SECRETS.broadcast, extra: object = {}) {
    const res = await fetch(`${base}/broadcast`, {
        method: 'POST',
        headers: {'x-ws-secret': secret, 'content-type': 'application/json'},
        body: JSON.stringify({room, event, data, ...extra}),
    });
    return res.status;
}

function rawRequest(path: string, headers: Record<string, string> = {}) {
    const {port} = new URL(base);
    return new Promise<number>((resolve) => {
        const req = http.request({host: '127.0.0.1', port, path, method: 'GET', headers}, (res) => {
            res.resume();
            resolve(res.statusCode ?? 0);
        });
        req.on('error', () => resolve(-1));
        req.end();
    });
}

const health = async () => (await fetch(`${base}/health`)).status;

// ---- #213: who receives channel content ----

test('ws: a volunteer cannot follow a ticket channel that is not theirs', async () => {
    const other = await client({jwt: 'jwt-other'});
    assert.equal(await ack(other, 'listen', {id: 'c1'}), false);
    for (const reserved of ['volunteers', 'readers', 'bots', 'user:vol']) {
        assert.equal(await ack(other, 'listen', {id: reserved}), false, reserved);
    }
});

test('ws: channel content reaches its members and readers only, not every volunteer', async () => {
    const [vol, reader, other] = await Promise.all([
        client({jwt: 'jwt-vol'}), client({jwt: 'jwt-reader'}), client({jwt: 'jwt-other'}),
    ]);
    const received = Promise.all([collect(vol, 'message'), collect(reader, 'message'), collect(other, 'message')]);
    assert.equal(await broadcast('c1', 'message', {content: 'secret'}), 200);
    const [v, r, o] = await received;
    assert.equal(v.length, 1, 'assigned volunteer');
    assert.equal(r.length, 1, 'tickets.read_all');
    assert.equal(o.length, 0, 'unrelated volunteer');
});

test('ws: room-less notifications still reach every volunteer', async () => {
    const other = await client({jwt: 'jwt-other'});
    const got = collect(other, 'updateRequest');
    assert.equal(await broadcast(null, 'updateRequest', {channelId: 'x'}), 200);
    assert.equal((await got).length, 1);
});

test('ws: unknown JWT or forged guest credentials are refused', async () => {
    await assert.rejects(client({jwt: 'nope'}));
    await assert.rejects(client({guest: {uid: 'g', channelId: 'c1', exp: Date.now() + 60_000, sig: 'x'.repeat(64)}}));
});

// ---- #214: authors and room checks ----

test('ws: the author of a relayed message is the sender, whatever the client claims', async () => {
    const [vol, reader] = await Promise.all([client({jwt: 'jwt-vol'}), client({jwt: 'jwt-reader'})]);
    const got = collect(reader, 'message');
    const ok = await ack(vol, 'sendMessage', {
        id: 7, channel: {id: 'c1'}, content: '<img src=x onerror=alert(1)>',
        author: {id: 'reader', name: 'Usurped', role: 'admin'},
    });
    assert.equal(ok, true);
    const [msg] = await got;
    assert.equal(msg.author.id, 'vol');
    assert.equal(msg.author.username, 'Vol');
    assert.equal(/<[a-zA-Z]/.test(msg.content), false);
});

test('ws: no relay to a channel the sender is not in, nor without write access', async () => {
    const [other, reader] = await Promise.all([client({jwt: 'jwt-other'}), client({jwt: 'jwt-reader'})]);
    assert.equal(await ack(other, 'sendMessage', {channel: {id: 'c1'}, content: 'x'}), false);
    assert.equal(await ack(reader, 'listen', {id: 'c1'}), true);
    // reader may read c1 but not write there (no send_message_all in this fake)
    assert.equal(await ack(reader, 'sendMessage', {channel: {id: 'c1'}, content: 'x'}), false);
    assert.equal(await ack(other, 'sendMessage', {channel: {id: '1'}, content: 'x'.repeat(2001)}), false);
});

test('ws: visitors only reach their own channel and never see who is online', async () => {
    const exp = Date.now() + 60_000;
    const guest = await client({guest: {uid: 'g1', channelId: 'c1', exp, sig: signGuest(SECRETS.guest, 'c1', 'g1', exp)}});
    assert.equal(await ack(guest, 'listen', {id: 'c2'}), false);
    assert.equal(await ack(guest, 'listen', {id: 'c1'}), true);
    assert.deepEqual(await ack(guest, 'getOnlineUsers', {channelID: 'c1'}), []);
    assert.equal(await ack(guest, 'sendMessage', {channel: {id: 'c1'}, content: 'x'}), false);
});

test('ws: typing indicators carry the server-side identity, only inside joined channels', async () => {
    const [vol, reader] = await Promise.all([client({jwt: 'jwt-vol'}), client({jwt: 'jwt-reader'})]);
    await ack(reader, 'listen', {id: 'c1'});
    const got = collect(reader, 'typingIndicator');
    vol.emit('typing', {id: 'c1', user: {id: 'reader', name: 'Usurped'}});
    vol.emit('typing', {id: 'c2'});
    const events = await got;
    assert.equal(events.length, 1);
    assert.equal(events[0].user.id, 'vol');
});

// ---- #216: bot channel ----

test('ws: only bot API keys join the bot channel; bot status needs the internal secret', async () => {
    const other = await client({jwt: 'jwt-other'});
    other.emit('bot:checkin', {userId: 'bot-user'});
    await new Promise(r => setTimeout(r, 50));
    const status = async (auth?: string) => {
        const res = await fetch(`${base}/bot-status?userId=bot-user`, auth ? {headers: {authorization: `Bearer ${auth}`}} : {});
        return {status: res.status, body: res.status === 200 ? await res.json() : null};
    };
    assert.equal((await status()).status, 401);
    assert.deepEqual((await status(SECRETS.internal)).body, {isConnected: false});

    const bot = await client({token: 'bot-key'});
    bot.emit('bot:checkin', {});
    await new Promise(r => setTimeout(r, 50));
    assert.deepEqual((await status(SECRETS.internal)).body, {isConnected: true});
});

// ---- #239: inputs that used to crash the service ----

test('ws: malformed events do not bring the service down', async () => {
    const other = await client({jwt: 'jwt-other'});
    other.emit('listen', {id: 'c1'}, 'not-a-function');
    other.emit('leave', {id: {toString: null}});
    other.emit('leave', null);
    other.emit('getOnlineUsers', null, 42);
    other.emit('sendMessage', null);
    other.emit('typing', 'x');
    other.emit('listen');
    await new Promise(r => setTimeout(r, 100));
    assert.equal(await health(), 200);
    assert.equal(other.connected, true);
});

test('ws: forged guest signatures with multibyte characters are refused without crashing', async () => {
    await assert.rejects(client({guest: {uid: 'g', channelId: 'c1', exp: Date.now() + 60_000, sig: 'é'.repeat(64)}}));
    assert.equal(await health(), 200);
});

test('ws: odd HTTP requests are answered once and do not crash', async () => {
    // Socket.IO answers this one; it used to be answered a second time as /health
    await rawRequest('/socket.io/../health');
    await rawRequest('/health', {host: '['});
    await rawRequest('//[::1');
    assert.equal(await rawRequest('/nope'), 404);
    assert.equal(await broadcast('c1', 'message', {}, 'wrong'), 401);
    const bad = await fetch(`${base}/broadcast`, {method: 'POST', headers: {'x-ws-secret': SECRETS.broadcast}, body: '{nope'});
    assert.equal(bad.status, 400);
    assert.equal(await broadcast('../x', 'message', {}), 400);
    assert.equal(await health(), 200);
});

test('ws: bot-only events reach bot sockets and no volunteer', async () => {
    const [bot, vol] = await Promise.all([client({token: 'bot-key'}), client({jwt: 'jwt-vol'})]);
    const got = Promise.all([collect(bot, 'voiceInvite'), collect(vol, 'voiceInvite')]);
    assert.equal(await broadcast('c1', 'voiceInvite', {url: 'https://x'}, SECRETS.broadcast, {audience: 'bots'}), 200);
    const [b, v] = await got;
    assert.equal(b.length, 1);
    assert.equal(v.length, 0);
});

test('ws: online means connected to Solar, on any page; announced on the first tab, gone with the last', async () => {
    const reader = await client({jwt: 'jwt-reader'});
    const online = collect(reader, 'userOnline');
    const offline = collect(reader, 'userOffline', 400);
    // "solo" follows no ticket channel: still online
    const [tab1, tab2] = [await client({jwt: 'jwt-solo'}), await client({jwt: 'jwt-solo'})];
    const users = await ack<{id: string}[]>(reader, 'getOnlineUsers', {channelID: 'c1'});
    assert.ok(users.some(u => u.id === 'solo'));
    assert.equal(new Set(users.map(u => u.id)).size, users.length);
    assert.deepEqual((await online).filter(e => e.user.id === 'solo').length, 1);

    tab1.disconnect();
    await new Promise(r => setTimeout(r, 50));
    tab2.disconnect();
    assert.deepEqual((await offline).filter(e => e.user.id === 'solo').length, 1);
    // A bot is never listed
    const bot = await client({token: 'bot-key'});
    assert.ok(!(await ack<{id: string}[]>(reader, 'getOnlineUsers', {})).some(u => u.id === 'bot-user'));
    assert.deepEqual(await ack(bot, 'getOnlineUsers', {}), []);
});

test('ws: team notes reach the volunteers of the room, never the visitor nor the bot', async () => {
    const exp = Date.now() + 60_000;
    const [vol, guest, bot, other] = await Promise.all([
        client({jwt: 'jwt-vol'}),
        client({guest: {uid: 'g9', channelId: 'c1', exp, sig: signGuest(SECRETS.guest, 'c1', 'g9', exp)}}),
        client({token: 'bot-key'}),
        client({jwt: 'jwt-other'}),
    ]);
    assert.equal(await ack(guest, 'listen', {id: 'c1'}), true);
    assert.equal(await ack(bot, 'listen', {id: 'c1'}), true);
    const got = Promise.all([vol, guest, bot, other].map(c => collect(c, 'message')));
    assert.equal(await broadcast('c1', 'message', {internal: true}, SECRETS.broadcast, {audience: 'staff'}), 200);
    const [v, g, b, o] = await got;
    assert.deepEqual([v.length, g.length, b.length, o.length], [1, 0, 0, 0]);
    assert.equal(await broadcast(null, 'message', {}, SECRETS.broadcast, {audience: 'staff'}), 400);
});

test('a bot whose key is revoked is disconnected on the next permissions update (#249)', async () => {
    const bot = await client({token: 'bot-key-2'});
    const closed = new Promise<string>(r => bot.once('disconnect', r));
    validKeys.delete('bot-key-2');
    assert.equal(await broadcast(null, 'permissionsUpdate', {}), 200);
    assert.equal(await closed, 'io server disconnect');
});

test('signing out closes the volunteer sockets of that session (#276)', async () => {
    const open = new Set(['s1']);
    const {httpServer, io} = createWsServer({
        verifyJwt: async (t) => ({sub: 'vol', sid: t}),
        checkApiKey: async () => null,
        getSession: async (id, sid) => (open.has(sid as string) ? sessions[id] ?? null : null),
        getChannelAccess: async (u, c) => access(u, c),
        secrets: SECRETS,
        sessionCheckMs: 50,
        log: quiet,
    });
    await new Promise<void>(r => httpServer.listen(0, '127.0.0.1', r));
    const url = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
    try {
        // A JWT of a session already closed is refused
        await assert.rejects(new Promise((resolve, reject) => {
            const c = connect(url, {auth: {jwt: 's2'}, transports: ['websocket'], forceNew: true, reconnection: false});
            c.once('connect', () => resolve(c));
            c.once('connect_error', reject);
        }));
        const c = connect(url, {auth: {jwt: 's1'}, transports: ['websocket'], forceNew: true, reconnection: false});
        await new Promise(r => c.once('connect', r));
        const closed = new Promise(r => c.once('disconnect', r));
        open.delete('s1');
        await closed;
        c.disconnect();
    } finally {
        io.close();
        await new Promise(r => httpServer.close(() => r(undefined)));
    }
});

test('ws: visitors get the room\'s events without the volunteers\' identity (#255)', async () => {
    const exp = Date.now() + 60_000;
    const [vol, guest] = await Promise.all([
        client({jwt: 'jwt-vol'}),
        client({guest: {uid: 'g7', channelId: 'c1', exp, sig: signGuest(SECRETS.guest, 'c1', 'g7', exp)}}),
    ]);
    assert.equal(await ack(guest, 'listen', {id: 'c1'}), true);
    const author = {id: 'vol', name: 'Vol', image: 'https://cdn.example/vol.png', role: 'Bénévole Écoutant'};
    const [toVolunteer, toGuest, joined] = [collect(vol, 'message'), collect(guest, 'message'), collect(guest, 'userJoined')];
    assert.equal(await broadcast('c1', 'message', {id: 5, author, content: 'Bonjour'}), 200);
    assert.equal(await ack(vol, 'listen', {id: 'c1'}), true);
    assert.deepEqual((await toVolunteer)[0].author, author);
    const seen = (await toGuest)[0];
    assert.equal(seen.content, 'Bonjour');
    assert.deepEqual(seen.author, {id: 'staff', name: 'Bénévole Écoutant', username: 'Bénévole Écoutant', image: null, role: null});
    assert.deepEqual(await joined, [], 'who joins the channel is not told to the visitor');

    const typing = collect(guest, 'typingIndicator');
    vol.emit('typing', {id: 'c1'});
    assert.equal((await typing)[0].user.name, 'Bénévole Écoutant');
});

test('ws: a flood of events is cut down, then the connection is closed (#258)', async () => {
    const c = await client({jwt: 'jwt-solo'});
    const answers = await Promise.all(Array.from({length: 60}, () => ack<boolean>(c, 'listen', {id: '1'})));
    assert.ok(answers.filter(a => a === false).length >= 20, 'events beyond the burst are refused');
    const closed = new Promise(r => c.once('disconnect', r));
    for (let i = 0; i < 400; i++) c.emit('ping');
    await closed;
});
