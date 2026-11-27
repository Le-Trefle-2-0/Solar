import test from 'node:test';
import assert from 'node:assert/strict';
import {takeToken} from './actionRateLimit';

test('public forms: at most `max` per window and per visitor, then allowed again', () => {
    const rule = {max: 2, windowMs: 1000};
    assert.equal(takeToken('contact:1.2.3.4', rule, 0), true);
    assert.equal(takeToken('contact:1.2.3.4', rule, 10), true);
    assert.equal(takeToken('contact:1.2.3.4', rule, 20), false);
    assert.equal(takeToken('contact:5.6.7.8', rule, 20), true);
    assert.equal(takeToken('contact:1.2.3.4', rule, 1001), true);
});
