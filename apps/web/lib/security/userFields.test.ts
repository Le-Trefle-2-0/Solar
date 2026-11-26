import test from 'node:test';
import assert from 'node:assert/strict';
import {SERVER_ONLY_USER_FIELDS, userAdditionalFields} from './userFields';

test('document status, dates and files cannot be written through update-user', () => {
    for (const name of SERVER_ONLY_USER_FIELDS) {
        const field = (userAdditionalFields as Record<string, {input?: boolean}>)[name];
        assert.ok(field, `${name} is missing`);
        assert.equal(field.input, false, `${name} must have input: false`);
    }
});

test('every document-related field is server-only', () => {
    const docLike = Object.keys(userAdditionalFields).filter(k => /^(documents|idCard|casier)/.test(k));
    assert.deepEqual([...docLike].sort(), [...SERVER_ONLY_USER_FIELDS].sort());
});

test('profile fields stay writable by the user', () => {
    for (const name of ['firstName', 'lastName', 'newsletterSubscription'] as const) {
        assert.notEqual((userAdditionalFields[name] as {input?: boolean}).input, false);
    }
});
