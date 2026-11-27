import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isValidUnsubscribe, unsubscribeSignature} from './unsubscribeToken.js';

test('unsubscribe links: signed per recipient, same value as the web app', () => {
    const sig = unsubscribeSignature('sub_1', 'secret');
    // Also asserted in apps/web/lib/security/unsubscribeToken.test.ts
    assert.equal(sig, 'HWF0CMUKtl6SDabYP3m0WSM29XwhtBcE3_auV2qwquU');
    assert.equal(isValidUnsubscribe('sub_1', sig, 'secret'), true);
    assert.equal(isValidUnsubscribe('sub_2', sig, 'secret'), false);
    assert.equal(isValidUnsubscribe('sub_1', sig, 'other'), false);
    assert.equal(isValidUnsubscribe('sub_1', undefined, 'secret'), false);
});
