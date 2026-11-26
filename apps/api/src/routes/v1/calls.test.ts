import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {CALL_TTL_MS, registerCallsRoutes, signCall, verifyCall} from './calls.js';

const SECRET = 'call-test-secret';
const NOW = 1_800_000_000_000;

async function setup(opts: {as?: string | null; perms?: string[]; write?: boolean} = {}) {
    const app = Fastify();
    await registerCallsRoutes(app, {
        authenticate: async () => (opts.as === undefined ? 'vol' : opts.as),
        getPermissions: async () => opts.perms ?? ['tickets.launch_voice'],
        canWrite: async () => opts.write ?? true,
        secret: () => SECRET,
        now: () => NOW,
    });
    return app;
}

test('calls: opening a call needs a session, launch_voice and write access to the channel', async () => {
    const body = {channelId: 'c1'};
    assert.equal((await (await setup({as: null})).inject({method: 'POST', url: '/v1/calls', payload: body})).statusCode, 401);
    assert.equal((await (await setup({perms: []})).inject({method: 'POST', url: '/v1/calls', payload: body})).statusCode, 403);
    assert.equal((await (await setup({write: false})).inject({method: 'POST', url: '/v1/calls', payload: body})).statusCode, 403);
    assert.equal((await (await setup()).inject({method: 'POST', url: '/v1/calls', payload: {channelId: '../x'}})).statusCode, 400);
});

test('calls: a call gets an unguessable id and a link the visitor page can verify', async () => {
    const app = await setup();
    const res = await app.inject({method: 'POST', url: '/v1/calls', payload: {channelId: 'c1'}});
    assert.equal(res.statusCode, 200);
    const call = res.json();
    assert.match(call.callId, /^call-[a-f0-9]{32}$/);
    assert.equal(call.exp, NOW + CALL_TTL_MS);
    const url = new URL(call.url);
    const verify = await app.inject(`/v1/calls/verify?callId=${call.callId}&${url.searchParams}`);
    assert.deepEqual(verify.json(), {valid: true});
});

test('calls: tampered, expired or foreign tokens are refused', () => {
    const callId = `call-${'a'.repeat(32)}`;
    const exp = NOW + 60_000;
    const t = signCall(SECRET, callId, 'c1', exp);
    assert.equal(verifyCall(SECRET, {callId, channelId: 'c1', exp, t}, NOW), true);
    assert.equal(verifyCall(SECRET, {callId, channelId: 'c2', exp, t}, NOW), false, 'other channel');
    assert.equal(verifyCall(SECRET, {callId: `call-${'b'.repeat(32)}`, channelId: 'c1', exp, t}, NOW), false, 'other call');
    assert.equal(verifyCall(SECRET, {callId, channelId: 'c1', exp, t}, exp + 1), false, 'expired');
    assert.equal(verifyCall(SECRET, {callId, channelId: 'c1', exp: NOW + CALL_TTL_MS * 10, t: signCall(SECRET, callId, 'c1', NOW + CALL_TTL_MS * 10)}, NOW), false, 'too long-lived');
    assert.equal(verifyCall('other-secret', {callId, channelId: 'c1', exp, t}, NOW), false, 'other secret');
    assert.equal(verifyCall(SECRET, {callId, channelId: 'c1', exp, t: 'é'.repeat(64)}, NOW), false);
    assert.equal(verifyCall(SECRET, {}, NOW), false);
});
