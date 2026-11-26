import test from 'node:test';
import assert from 'node:assert/strict';
import {canReadChannel, canWriteChannel, MessageInputSchema, MESSAGE_MAX_LENGTH} from './channelAccess';
import {neutralizeHtml} from './sanitize';

const base = {channelId: 'c', userId: 'u1', permissions: [] as string[], assignedUserId: null as string | null};

test('write: anyone signed in may write in the public channel', () => {
    assert.equal(canWriteChannel({...base, channelId: '1'}), true);
});

test('write: assigned volunteer needs tickets.send_message', () => {
    assert.equal(canWriteChannel({...base, assignedUserId: 'u1', permissions: ['tickets.send_message']}), true);
    assert.equal(canWriteChannel({...base, assignedUserId: 'u1'}), false);
});

test('write: not assigned and no send_message_all is refused', () => {
    assert.equal(canWriteChannel({...base, assignedUserId: 'u2', permissions: ['tickets.send_message']}), false);
    assert.equal(canWriteChannel({...base, permissions: ['tickets.send_message', 'tickets.read_all']}), false);
});

test('write: tickets.send_message_all and admin.sudo write anywhere', () => {
    assert.equal(canWriteChannel({...base, permissions: ['tickets.send_message_all']}), true);
    assert.equal(canWriteChannel({...base, permissions: ['admin.sudo']}), true);
});

test('read: public channel, read_all or assigned', () => {
    assert.equal(canReadChannel({...base, channelId: '1'}), true);
    assert.equal(canReadChannel({...base, permissions: ['tickets.read_all']}), true);
    assert.equal(canReadChannel({...base, assignedUserId: 'u1'}), true);
    assert.equal(canReadChannel({...base, assignedUserId: 'u2'}), false);
    assert.equal(canReadChannel(base), false);
});

test('schema: accepts a normal message', () => {
    assert.equal(MessageInputSchema.safeParse({channelId: 'c', content: 'Bonjour', replyID: 3}).success, true);
    assert.equal(MessageInputSchema.safeParse({channelId: 'c', content: 'Bonjour', replyID: null}).success, true);
});

test('schema: refuses non-string, empty or oversized content', () => {
    for (const content of [undefined, '', 'x'.repeat(MESSAGE_MAX_LENGTH + 1), 42, {length: 1e9}, ['a'], {type: 'Buffer', data: [1]}]) {
        assert.equal(MessageInputSchema.safeParse({channelId: 'c', content}).success, false, JSON.stringify(content)?.slice(0, 40));
    }
});

test('schema: refuses a client-supplied author', () => {
    assert.equal(MessageInputSchema.safeParse({channelId: 'c', content: 'x', author: {id: 'victim'}}).success, false);
});

test('neutralizeHtml defuses a simple XSS payload and keeps plain text', () => {
    const out = neutralizeHtml('<img src=x onerror=alert(1)><script>alert(1)</script>');
    assert.equal(/<[a-zA-Z!/?]/.test(out), false);
    assert.equal(neutralizeHtml('a < b <3'), 'a < b <3');
    assert.equal(neutralizeHtml(out), out);
});
