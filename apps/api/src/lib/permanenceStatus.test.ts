import {test} from 'node:test';
import assert from 'node:assert/strict';
import {computePermanenceStatus} from './permanenceStatus.js';

const at = (iso: string) => new Date(iso);
const tonight = {start: at('2026-11-27T19:00:00Z'), end: at('2026-11-27T22:00:00Z')};
const tomorrow = {start: at('2026-11-28T19:00:00Z'), end: at('2026-11-28T22:00:00Z')};

test('permanence status: open while an event is running', () => {
    assert.deepEqual(computePermanenceStatus([tonight, tomorrow], at('2026-11-27T20:30:00Z')),
        {open: true, closesAt: '2026-11-27T22:00:00.000Z'});
});

test('permanence status: closed before, between and after events, with the next opening', () => {
    assert.deepEqual(computePermanenceStatus([tomorrow, tonight], at('2026-11-27T12:00:00Z')),
        {open: false, nextOpening: {start: '2026-11-27T19:00:00.000Z', end: '2026-11-27T22:00:00.000Z'}});
    // The end time itself is closed
    assert.equal(computePermanenceStatus([tonight, tomorrow], at('2026-11-27T22:00:00Z')).open, false);
    assert.deepEqual(computePermanenceStatus([tonight], at('2026-11-28T00:00:00Z')), {open: false, nextOpening: null});
    assert.deepEqual(computePermanenceStatus([], at('2026-11-28T00:00:00Z')), {open: false, nextOpening: null});
});
