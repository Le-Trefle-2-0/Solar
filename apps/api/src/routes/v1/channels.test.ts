import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {registerChannelsRoutes} from './channels.js';

async function get(id: string, authedAs: string | null, perms: string[] = [], assignedUserId: string | null = null) {
    const app = Fastify();
    await registerChannelsRoutes(app, {
        authenticate: async () => authedAs,
        getPermissions: async () => perms,
        findChannel: async (channelId) => channelId === 'missing' ? null : {id: channelId, name: 'n'},
        findTicketByChannelId: async (channelId) => channelId === 'c' ? {assignedUserId} : null,
    });
    return (await app.inject(`/v1/channel/${id}`)).statusCode;
}

test('401 without authentication', async () => {
    assert.equal(await get('c', null), 401);
    assert.equal(await get('1', null), 401);
});

test('403 for a ticket channel assigned to someone else', async () => {
    assert.equal(await get('c', 'user1', [], 'someone-else'), 403);
});

test('403 for an unknown channel without tickets.read_all', async () => {
    assert.equal(await get('missing', 'user1'), 403);
});

test('200 for the assigned user', async () => {
    assert.equal(await get('c', 'user1', [], 'user1'), 200);
});

test('200 with tickets.read_all', async () => {
    assert.equal(await get('c', 'user1', ['tickets.read_all']), 200);
});

test('200 on the public channel for any signed-in user', async () => {
    assert.equal(await get('1', 'user1'), 200);
});

test('404 for an unknown channel with tickets.read_all', async () => {
    assert.equal(await get('missing', 'user1', ['tickets.read_all']), 404);
});

test('read markers (#228): refused for a channel the caller cannot read', async () => {
    const app = Fastify();
    await registerChannelsRoutes(app, {
        authenticate: async () => 'user1',
        getPermissions: async () => [],
        findChannel: async (id) => ({id, name: 'n'}),
        findTicketByChannelId: async () => ({assignedUserId: 'someone-else'}),
    });
    assert.equal((await app.inject('/v1/channel/c/read')).statusCode, 403);
    assert.equal((await app.inject({method: 'POST', url: '/v1/channel/c/read'})).statusCode, 403);
});
