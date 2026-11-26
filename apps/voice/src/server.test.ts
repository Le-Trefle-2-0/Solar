import {after, before, test} from 'node:test';
import assert from 'node:assert/strict';
import type {AddressInfo} from 'node:net';
import {io as connect, type Socket as ClientSocket} from 'socket.io-client';
import {createVoiceServer, type Grant, type RoomState, type RouterLike} from './server.js';

// ---- a fake mediasoup: enough to exercise signalling and rules ----
let seq = 0;
function fakeRouter(): RouterLike {
    return {
        rtpCapabilities: {codecs: [{mimeType: 'audio/opus'}]},
        canConsume: () => true,
        createWebRtcTransport: async () => {
            const id = `t${++seq}`;
            return {
                id, iceParameters: {}, iceCandidates: [], dtlsParameters: {},
                connect: async () => undefined,
                produce: async () => ({id: `p${++seq}`, paused: false, pause: async () => undefined, resume: async () => undefined, close: () => undefined}),
                consume: async () => ({
                    id: `c${++seq}`, kind: 'audio', rtpParameters: {}, type: 'simple', producerPaused: false,
                    resume: async () => undefined, close: () => undefined, on: () => undefined,
                }),
                close: () => undefined,
            };
        },
        close: () => undefined,
    };
}

// Fake API: "perm" is a permanence channel, "live" a voice ticket handled by "vol".
const authorize = async ({room, userId, token}: {room: {type: string; channelId: string}; userId?: string; token?: unknown}): Promise<Grant> => {
    if (room.type === 'permanence') {
        return userId && room.channelId === 'perm' ? {allowed: true, role: 'volunteer', userId, name: userId} : {allowed: false, reason: 'forbidden'};
    }
    if (room.channelId !== 'live') return {allowed: false, reason: 'no_voice_call'};
    if (userId === 'vol' || userId === 'vol2') return {allowed: true, role: 'volunteer', userId, name: userId};
    if (!userId && (token as {t?: string})?.t === 'good') return {allowed: true, role: 'visitor', userId: null, name: 'Visiteur'};
    return {allowed: false, reason: 'forbidden'};
};

const states: RoomState[] = [];
let base = '';
let stop: () => Promise<void>;

before(async () => {
    const {httpServer, io} = createVoiceServer({
        verifyJwt: async (t) => (t.startsWith('jwt-') ? {sub: t.slice(4)} : null),
        authorize: authorize as any,
        createRouter: async () => fakeRouter(),
        publishState: async (s) => {
            states.push(s);
        },
        internalSecret: 'internal',
        log: {log: () => undefined, warn: () => undefined, error: () => undefined},
    });
    await new Promise<void>(r => httpServer.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
    stop = () => new Promise(r => {
        io.close();
        httpServer.close(() => r());
    });
});
after(async () => stop());

const sockets: ClientSocket[] = [];
after(() => sockets.forEach(s => s.disconnect()));

function client(auth: Record<string, unknown>) {
    return new Promise<ClientSocket>((resolve, reject) => {
        const s = connect(base, {auth, transports: ['websocket'], forceNew: true, reconnection: false});
        sockets.push(s);
        s.once('connect', () => resolve(s));
        s.once('connect_error', reject);
    });
}
const ask = <T = any>(s: ClientSocket, event: string, payload?: unknown) => new Promise<T>(r => s.emit(event, payload, (v: T) => r(v)));
const tick = () => new Promise(r => setTimeout(r, 60));

test('voice: every member can join the permanence room and sees the others by name', async () => {
    const a = await client({jwt: 'jwt-alice'});
    const b = await client({jwt: 'jwt-bob'});
    const joined = new Promise<any>(r => a.once('peerJoined', r));
    const ra = await ask(a, 'join', {room: {type: 'permanence', channelId: 'perm'}});
    assert.ok(ra.rtpCapabilities);
    const rb = await ask(b, 'join', {room: {type: 'permanence', channelId: 'perm'}});
    assert.deepEqual(rb.peers.map((p: any) => p.name), ['alice']);
    assert.equal((await joined).name, 'bob');
    await tick();
    const last = states.filter(s => s.channelId === 'perm').at(-1) as Extract<RoomState, {type: 'permanence'}>;
    assert.deepEqual(last.participants.map(p => p.name).sort(), ['alice', 'bob']);
    a.disconnect();
    b.disconnect();
});

test('voice: a ticket call is one volunteer and one visitor, who only see aliases', async () => {
    const vol = await client({jwt: 'jwt-vol'});
    const visitor = await client({voiceToken: {channelId: 'live', exp: 1, t: 'good'}});
    const vol2 = await client({jwt: 'jwt-vol2'});
    const rv = await ask(vol, 'join', {room: {type: 'ticket', channelId: 'live'}});
    assert.deepEqual(rv.peers, []);
    const rvis = await ask(visitor, 'join', {room: {type: 'ticket', channelId: 'live'}});
    assert.deepEqual(rvis.peers.map((p: any) => p.name), ['Bénévole Écoutant'], 'the visitor never sees the volunteer\'s name');
    // A second volunteer (e.g. the supervisor) cannot join a one-to-one call
    assert.deepEqual(await ask(vol2, 'join', {room: {type: 'ticket', channelId: 'live'}}), {error: 'room_full'});
    await tick();
    const last = states.filter(s => s.channelId === 'live').at(-1);
    assert.deepEqual(last, {type: 'ticket', channelId: 'live', volunteer: true, visitor: true});
    vol.disconnect();
    await tick();
    assert.deepEqual(states.filter(s => s.channelId === 'live').at(-1), {type: 'ticket', channelId: 'live', volunteer: false, visitor: true});
    visitor.disconnect();
    vol2.disconnect();
});

test('voice: refused joins, and visitors never enter a permanence room', async () => {
    const visitor = await client({voiceToken: {channelId: 'live', exp: 1, t: 'bad'}});
    assert.deepEqual(await ask(visitor, 'join', {room: {type: 'ticket', channelId: 'live'}}), {error: 'forbidden'});
    assert.deepEqual(await ask(visitor, 'join', {room: {type: 'permanence', channelId: 'perm'}}), {error: 'forbidden'});
    const vol = await client({jwt: 'jwt-vol'});
    assert.deepEqual(await ask(vol, 'join', {room: {type: 'ticket', channelId: 'other'}}), {error: 'no_voice_call'});
    assert.deepEqual(await ask(vol, 'join', {room: {type: 'video', channelId: 'perm'}}), {error: 'invalid_room'});
    await assert.rejects(client({jwt: 'nope'}));
    visitor.disconnect();
    vol.disconnect();
});

test('voice: audio only, one producer, consume only within the room', async () => {
    const a = await client({jwt: 'jwt-ann'});
    const b = await client({jwt: 'jwt-ben'});
    await ask(a, 'join', {room: {type: 'permanence', channelId: 'perm'}});
    await ask(b, 'join', {room: {type: 'permanence', channelId: 'perm'}});
    const send = await ask(a, 'createTransport', {direction: 'send'});
    assert.deepEqual(await ask(a, 'produce', {transportId: send.id, kind: 'video', rtpParameters: {}}), {error: 'audio_only'});
    const newProducer = new Promise<any>(r => b.once('newProducer', r));
    const produced = await ask(a, 'produce', {transportId: send.id, kind: 'audio', rtpParameters: {}});
    assert.ok(produced.id);
    assert.deepEqual(await ask(a, 'produce', {transportId: send.id, kind: 'audio', rtpParameters: {}}), {error: 'already_producing'});
    assert.equal((await newProducer).producerId, produced.id);
    const recv = await ask(b, 'createTransport', {direction: 'recv'});
    const consumed = await ask(b, 'consume', {transportId: recv.id, producerId: produced.id, rtpCapabilities: {}});
    assert.equal(consumed.producerId, produced.id);
    // Cannot consume oneself, nor an unknown producer
    assert.deepEqual(await ask(a, 'consume', {transportId: send.id, producerId: produced.id, rtpCapabilities: {}}), {error: 'unknown_producer'});
    assert.deepEqual(await ask(b, 'consume', {transportId: recv.id, producerId: 'p-unknown', rtpCapabilities: {}}), {error: 'unknown_producer'});
    // Mute is shared with the room
    const muted = new Promise<any>(r => b.once('peerMuted', r));
    assert.deepEqual(await ask(a, 'setMuted', {muted: true}), {ok: true});
    assert.equal((await muted).muted, true);
    a.disconnect();
    b.disconnect();
});

test('voice: malformed events and requests do not break the service', async () => {
    const s = await client({jwt: 'jwt-zed'});
    s.emit('join', null, 'not-a-function');
    s.emit('consume', {transportId: {}}, () => undefined);
    s.emit('setMuted', 'yes');
    assert.deepEqual(await ask(s, 'createTransport'), {error: 'not_in_room'});
    assert.equal((await fetch(`${base}/health`)).status, 200);
    assert.equal((await fetch(`${base}/internal/status`)).status, 401);
    const status = await fetch(`${base}/internal/status`, {headers: {authorization: 'Bearer internal'}});
    assert.equal(status.status, 200);
    assert.ok(Array.isArray((await status.json()).rooms));
    s.disconnect();
});

test('voice: the API can close a room, which disconnects everyone in it', async () => {
    const vol = await client({jwt: 'jwt-vol'});
    const visitor = await client({voiceToken: {channelId: 'live', exp: 1, t: 'good'}});
    await ask(vol, 'join', {room: {type: 'ticket', channelId: 'live'}});
    await ask(visitor, 'join', {room: {type: 'ticket', channelId: 'live'}});
    const closed = new Promise(r => visitor.once('roomClosed', r));
    const close = (secret: string, body: object) => fetch(`${base}/internal/rooms/close`, {
        method: 'POST', headers: {authorization: `Bearer ${secret}`, 'content-type': 'application/json'}, body: JSON.stringify(body),
    });
    assert.equal((await close('wrong', {type: 'ticket', channelId: 'live'})).status, 401);
    assert.equal((await close('internal', {type: 'ticket', channelId: '../x'})).status, 400);
    const res = await close('internal', {type: 'ticket', channelId: 'live'});
    assert.deepEqual(await res.json(), {closed: true});
    await closed;
    await tick();
    assert.equal(visitor.connected, false);
    assert.equal(vol.connected, false);
    assert.deepEqual(states.filter(s => s.channelId === 'live').at(-1), {type: 'ticket', channelId: 'live', volunteer: false, visitor: false});
});
