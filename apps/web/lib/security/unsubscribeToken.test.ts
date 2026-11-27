import test from 'node:test';
import assert from 'node:assert/strict';
import {isValidUnsubscribe, unsubscribeSignature} from './unsubscribeToken';

test('unsubscribe links: same signature as the API, refused when altered', () => {
    // Also asserted in apps/api/src/lib/unsubscribeToken.test.ts
    assert.equal(unsubscribeSignature('sub_1', 'secret'), 'HWF0CMUKtl6SDabYP3m0WSM29XwhtBcE3_auV2qwquU');
    assert.equal(isValidUnsubscribe('sub_1', 'HWF0CMUKtl6SDabYP3m0WSM29XwhtBcE3_auV2qwquU', 'secret'), true);
    assert.equal(isValidUnsubscribe('sub_2', 'HWF0CMUKtl6SDabYP3m0WSM29XwhtBcE3_auV2qwquU', 'secret'), false);
    assert.equal(isValidUnsubscribe('sub_1', '', 'secret'), false);
});
