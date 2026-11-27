import {test} from 'node:test';
import assert from 'node:assert/strict';
import {membershipFields} from './membership';
import {documentsBlocked} from './accountStanding';

test('adhésion requested: the account keeps the defaults (documents missing)', () => {
    assert.deepEqual(membershipFields(true), {});
    assert.equal(documentsBlocked({documentsStatus: 'missing'}), true);
});

test('adhésion not requested: the account starts validated and is not held', () => {
    const now = new Date(2026, 10, 27);
    const fields = membershipFields(false, now);
    assert.deepEqual(fields, {documentsStatus: 'validated', idCardStatus: 'validated', casierStatus: 'validated', documentsValidatedAt: now});
    assert.equal(documentsBlocked(fields), false);
});
