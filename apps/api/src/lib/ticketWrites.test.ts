import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isTicketWritable} from './ticketWrites.js';

test('only waiting and ongoing écoutes are written in; other channels follow their own rules', () => {
    assert.equal(isTicketWritable({statusName: 'waiting'}), true);
    assert.equal(isTicketWritable({statusName: 'started'}), true);
    assert.equal(isTicketWritable({statusName: 'closed'}), false);
    assert.equal(isTicketWritable({statusName: 'commented'}), false);
    assert.equal(isTicketWritable(null), true);
});
