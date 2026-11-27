import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allowedOrigins, isSameSiteRequest} from './requestOrigin.js';

test('allowed origins: the web app, plus API_CORS_ORIGIN; nothing else by default', () => {
    assert.deepEqual(allowedOrigins({}, 'https://solar.example/'), ['https://solar.example']);
    assert.deepEqual(allowedOrigins({API_CORS_ORIGIN: 'https://letrefle.org, https://solar.example'}, 'https://solar.example'),
        ['https://solar.example', 'https://letrefle.org']);
});

test('widget actions: refused from another site', () => {
    const allowed = ['https://solar.example'];
    assert.equal(isSameSiteRequest('https://solar.example', allowed), true);
    assert.equal(isSameSiteRequest('https://evil.example', allowed), false);
    assert.equal(isSameSiteRequest('null', allowed), false);
    assert.equal(isSameSiteRequest(undefined, allowed), true);
});
