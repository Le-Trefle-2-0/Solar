import {test} from 'node:test';
import assert from 'node:assert/strict';
import {redactUrl} from './redact.js';
import {authenticate} from '../auth.js';

test('credentials are removed from logged URLs', () => {
    assert.equal(redactUrl('/v1/x?a=1&token=abc&Key=def'), '/v1/x?a=1&token=[redacted]&Key=[redacted]');
});

test('a token in the query string does not authenticate', async () => {
    assert.equal(await authenticate({headers: {}, query: {token: 'a-valid-looking-key'}}), null);
});
