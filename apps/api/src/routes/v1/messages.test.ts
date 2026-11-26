import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {registerMessagesRoutes} from './messages.js';

async function get(id: string, authedAs: string | null, perms: string[] = [], assignedUserId: string | null = null) {
    const app = Fastify();
    const read: string[] = [];
    await registerMessagesRoutes(app, {
        authenticate: async () => authedAs,
        getPermissions: async () => perms,
        findTicketByChannelId: async (channelId) => channelId === 'c' ? {assignedUserId} : null,
        isPermanenceChannel: async (channelId) => channelId === 'perm',
        findMessages: async (where) => {
            read.push(where.channelId);
            return [];
        },
    });
    const res = await app.inject(`/v1/messages/${id}`);
    return {status: res.statusCode, read};
}

test('401 without authentication', async () => {
    assert.equal((await get('c', null)).status, 401);
});

test('403 for a channel the caller is not assigned to, without reading messages', async () => {
    for (const id of ['c', 'unknown', '5']) {
        assert.deepEqual(await get(id, 'user1', [], 'someone-else'), {status: 403, read: []});
    }
});

test('200 for the assigned user, tickets.read_all and the public channel', async () => {
    assert.equal((await get('c', 'user1', [], 'user1')).status, 200);
    assert.equal((await get('c', 'user1', ['tickets.read_all'])).status, 200);
    assert.equal((await get('1', 'user1')).status, 200);
});

test('an empty channel never falls back to another one', async () => {
    assert.deepEqual((await get('1', 'user1')).read, ['1']);
});

test('a permanence channel is open to every member, without any permission', async () => {
    assert.deepEqual(await get('perm', 'user1'), {status: 200, read: ['perm']});
});
