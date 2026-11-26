import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {registerAvailableUsersRoutes, type AvailableUsersDeps} from './availableUsers.js';

process.env.DISCORD_ID_HASH_SECRET ??= 'test-secret';

// Extra columns a careless query could return: the route must strip them.
const leaky = [
    {id: 'u1', name: 'Alice', email: 'a@x.fr', birthDate: '2000-01-01', idCardFileId: 'f1', addressCity: 'Paris'},
    {id: 'u2', name: 'Bob', email: 'b@x.fr', casierFileId: 'f2'},
];

interface CallOpts {
    as?: string | null;
    perms?: string[];
    recent?: string[];
}

async function call(url: string, opts: CallOpts = {}) {
    const app = Fastify();
    const deps: AvailableUsersDeps = {
        authenticate: async () => (opts.as === undefined ? 'caller' : opts.as),
        getPermissions: async () => opts.perms ?? ['tickets.attribute'],
        findTicketByChannelId: async (id) => (id === 'c' ? {discordUserID: 'd1', voice: false} : null),
        findUsers: async () => leaky as any,
        findAssignedUserIds: async () => opts.recent ?? [],
    };
    await registerAvailableUsersRoutes(app, deps);
    const res = await app.inject(url);
    return {status: res.statusCode, body: res.statusCode === 200 ? res.json() : null};
}

test('getAvailable: 401 without authentication', async () => {
    assert.equal((await call('/v1/events/getAvailable?channelID=c', {as: null})).status, 401);
});

test('getAvailable: 403 without tickets.attribute', async () => {
    assert.equal((await call('/v1/events/getAvailable?channelID=c', {perms: ['tickets.read_all']})).status, 403);
});

test('getAvailable: 400 without channelID (no "every user" fallback)', async () => {
    assert.equal((await call('/v1/events/getAvailable')).status, 400);
});

test('getAvailable: 404 for an unknown channel (no "every user" fallback)', async () => {
    assert.equal((await call('/v1/events/getAvailable?channelID=nope')).status, 404);
});

test('getAvailable: only id and name, recently assigned users excluded', async () => {
    const {status, body} = await call('/v1/events/getAvailable?channelID=c', {recent: ['u2']});
    assert.equal(status, 200);
    assert.deepEqual(body, [{id: 'u1', name: 'Alice'}]);
});

test('getAvailable: ineligible lists only carry id and name', async () => {
    const {status, body} = await call('/v1/events/getAvailable?channelID=c&lists=ineligible', {recent: ['u1']});
    assert.equal(status, 200);
    assert.deepEqual(body, {
        ineligibleText: [{id: 'u1', name: 'Alice'}],
        ineligibleVoice: [{id: 'u1', name: 'Alice'}],
    });
});

test('getAvailable: admin.sudo is accepted', async () => {
    assert.equal((await call('/v1/events/getAvailable?channelID=c', {perms: ['admin.sudo']})).status, 200);
});
