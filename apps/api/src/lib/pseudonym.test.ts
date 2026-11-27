import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'crypto';
import {pseudonymize, requesterIdVariants, upgradeLegacyHash} from './pseudonym.js';

process.env.DISCORD_ID_HASH_SECRET = 'test-secret';

const ID = '123456789012345678';
const legacy = createHash('sha256').update(ID).digest('hex');

test('the pseudonym cannot be recomputed without the secret', () => {
    const value = pseudonymize(ID);
    assert.ok(!value.includes(ID) && !value.includes(legacy));
    process.env.DISCORD_ID_HASH_SECRET = 'other-secret';
    assert.notEqual(pseudonymize(ID), value);
    process.env.DISCORD_ID_HASH_SECRET = 'test-secret';
    assert.equal(pseudonymize(ID), value);
});

test('legacy hashes convert to the same pseudonym, only once', () => {
    assert.equal(upgradeLegacyHash(legacy), pseudonymize(ID));
    assert.equal(upgradeLegacyHash(pseudonymize(ID)), null);
    assert.equal(upgradeLegacyHash(ID), null);
});

test('past tickets of a requester are still matched', () => {
    assert.deepEqual(requesterIdVariants(ID), [ID, pseudonymize(ID), legacy]);
    assert.ok(requesterIdVariants(legacy).includes(pseudonymize(ID)));
    assert.deepEqual(requesterIdVariants(pseudonymize(ID)), [pseudonymize(ID)]);
});
