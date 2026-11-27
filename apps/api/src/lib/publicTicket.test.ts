import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicTicket} from './publicTicket.js';

test('tickets sent to the app never carry the requester id nor metadata', () => {
    const out = publicTicket({id: 1, channelId: 'c', discordUserID: '123456789012345678', metadata: {a: 1}, statusName: 'started'});
    assert.deepEqual(out, {id: 1, channelId: 'c', statusName: 'started'});
});
