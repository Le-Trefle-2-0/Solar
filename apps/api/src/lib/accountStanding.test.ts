import {test} from 'node:test';
import assert from 'node:assert/strict';
import {documentsBlocked, isBanned} from './accountStanding.js';

const now = new Date('2026-11-27T12:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 3600_000);

test('banned: until the ban expires, or for good without an end date', () => {
    assert.equal(isBanned({banned: true}, now), true);
    assert.equal(isBanned({banned: true, banExpires: daysAgo(-1)}, now), true);
    assert.equal(isBanned({banned: true, banExpires: daysAgo(1)}, now), false);
    assert.equal(isBanned({banned: false}, now), false);
    assert.equal(isBanned({banned: null}, now), false);
});

test('documents: missing or refused blocks, a renewal leaves 14 days', () => {
    assert.equal(documentsBlocked({documentsStatus: 'validated'}, now), false);
    assert.equal(documentsBlocked({documentsStatus: 'submitted'}, now), false);
    assert.equal(documentsBlocked({documentsStatus: 'missing'}, now), true);
    assert.equal(documentsBlocked({documentsStatus: 'rejected', documentsRenewalAt: daysAgo(1)}, now), true);
    assert.equal(documentsBlocked({documentsStatus: 'missing', documentsRenewalAt: daysAgo(13)}, now), false);
    assert.equal(documentsBlocked({documentsStatus: 'missing', documentsRenewalAt: daysAgo(14)}, now), true);
});
