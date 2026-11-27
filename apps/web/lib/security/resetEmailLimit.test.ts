import test from 'node:test';
import assert from 'node:assert/strict';
import {allowResetEmail, MAX_RESET_EMAILS_PER_HOUR} from './resetEmailLimit';

test('reset e-mails: a few per address and per hour, whatever the case of the address', () => {
    const t0 = Date.UTC(2026, 10, 27, 12);
    for (let i = 0; i < MAX_RESET_EMAILS_PER_HOUR; i++) assert.equal(allowResetEmail('Someone@Example.org', t0 + i), true);
    assert.equal(allowResetEmail('someone@example.org', t0 + 10), false);
    assert.equal(allowResetEmail('other@example.org', t0 + 10), true);
    assert.equal(allowResetEmail('someone@example.org', t0 + 61 * 60 * 1000), true);
});
