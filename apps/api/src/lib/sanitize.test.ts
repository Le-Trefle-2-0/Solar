import {test} from 'node:test';
import assert from 'node:assert/strict';
import {neutralizeHtml} from './sanitize.js';

test('no tag survives in an XSS payload', () => {
    for (const payload of [
        '<script>alert(1)</script>', '<img src=x onerror=alert(1)', '<svg/onload=alert(1)>', '<!--x--><?x>',
    ]) assert.doesNotMatch(neutralizeHtml(payload), /<[a-zA-Z!/?]/, payload);
});

test('ordinary text is untouched and the function is idempotent', () => {
    assert.equal(neutralizeHtml('<3 et 1 < 2 > 0 & "ok"'), '<3 et 1 < 2 > 0 & "ok"');
    const once = neutralizeHtml('<b>x</b>');
    assert.equal(neutralizeHtml(once), once);
});
