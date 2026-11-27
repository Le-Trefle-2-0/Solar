import {test} from 'node:test';
import assert from 'node:assert/strict';
import {internalRecipients} from './newsletterRecipients.js';

const roles = [
    {name: 'Bénévole Écoutant', permissions: JSON.stringify(['tickets.send_message'])},
    {name: 'none', permissions: '[]'},
];
const ok = {banned: false, banExpires: null, documentsStatus: 'validated', documentsRenewalAt: null, twoFactorEnabled: true};
const user = (id: string, role: string | null, standing = {}) => ({id, email: `${id}@x.fr`, role, ...ok, ...standing});

test('internal newsletters: active team members only', () => {
    const users = [
        user('vol', 'Bénévole Écoutant'),
        user('owner', null),
        user('selfsignup', 'none'),
        user('norole', null),
        user('banned', 'Bénévole Écoutant', {banned: true}),
        user('nodocs', 'Bénévole Écoutant', {documentsStatus: 'missing'}),
        user('bot_1', 'Bénévole Écoutant'),
    ];
    assert.deepEqual(internalRecipients(users, 'owner', roles).map(u => u.id), ['vol', 'owner']);
});
