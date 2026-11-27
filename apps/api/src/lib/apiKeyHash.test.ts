import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hashApiKey} from './apiKeyHash.js';

test('API keys are stored as their SHA-256 (base64url), never as given', () => {
    assert.equal(hashApiKey('sk_bot_example'), 'yxjXTzws5MkWVo2FmoHWAUd6dMvV9g9J_qAbhf4JANk');
    assert.notEqual(hashApiKey('sk_bot_example'), 'sk_bot_example');
});
