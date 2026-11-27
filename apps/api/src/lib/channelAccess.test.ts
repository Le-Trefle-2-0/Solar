import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canReadChannel, canWriteChannel} from './channelAccess.js';

const base = {channelId: 'c', userId: 'u1', permissions: [] as string[], assignedUserId: null as string | null};

test('channel read: public channel, read_all or assigned', () => {
    assert.equal(canReadChannel({...base, channelId: '1'}), true);
    assert.equal(canReadChannel({...base, permissions: ['tickets.read_all']}), true);
    assert.equal(canReadChannel({...base, assignedUserId: 'u1', permissions: ['tickets.send_message']}), true);
    // Assigned, but the role no longer allows listening (#249)
    assert.equal(canReadChannel({...base, assignedUserId: 'u1'}), false);
    assert.equal(canReadChannel({...base, assignedUserId: 'u2', permissions: ['tickets.send_message']}), false);
    assert.equal(canReadChannel(base), false);
});

test('channel write (#217): public channel, send_message_all, or assigned with send_message', () => {
    assert.equal(canWriteChannel({...base, channelId: '1'}), true);
    assert.equal(canWriteChannel({...base, permissions: ['tickets.send_message_all']}), true);
    assert.equal(canWriteChannel({...base, permissions: ['admin.sudo']}), true);
    assert.equal(canWriteChannel({...base, assignedUserId: 'u1', permissions: ['tickets.send_message']}), true);
    assert.equal(canWriteChannel({...base, assignedUserId: 'u1'}), false);
    assert.equal(canWriteChannel({...base, assignedUserId: 'u2', permissions: ['tickets.send_message']}), false);
    // Reading everything does not mean writing everywhere
    assert.equal(canWriteChannel({...base, permissions: ['tickets.read_all']}), false);
});

test('permanence channels: read and write for every member, no permission or sign-up needed', () => {
    assert.equal(canReadChannel({...base, channelId: 'perm', isPermanence: true}), true);
    assert.equal(canWriteChannel({...base, channelId: 'perm', isPermanence: true}), true);
});
