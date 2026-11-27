import {test} from 'node:test';
import assert from 'node:assert/strict';
import {membersWhoCanRead, type MemberRow} from './channelMembers.js';

const roles = [
    {name: 'Bénévole Écoutant', permissions: JSON.stringify(['tickets.send_message'])},
    {name: 'Référent', permissions: JSON.stringify(['tickets.read_all', 'tickets.attribute'])},
    {name: 'Rédacteur', permissions: JSON.stringify(['newsletters.manage'])},
];
const ok = {banned: false, banExpires: null, documentsStatus: 'validated', documentsRenewalAt: null, twoFactorEnabled: true};
const user = (id: string, role: string | null, standing: Partial<typeof ok> = {}): MemberRow =>
    ({id, name: id, username: null, displayUsername: null, image: null, role, ...ok, ...standing});

const users = [
    user('vol', 'Bénévole Écoutant'),
    user('vol2', 'Bénévole Écoutant'),
    user('ref', 'Référent'),
    user('redac', 'Rédacteur'),
    user('owner', null),
    user('banned', 'Référent', {banned: true}),
    user('nodocs', 'Bénévole Écoutant', {documentsStatus: 'missing'}),
    user('bot_1', 'Référent'),
];
const ids = (channel: Parameters<typeof membersWhoCanRead>[1]) => membersWhoCanRead(users, channel, 'owner', roles).map(m => m.id);

test('members of an écoute: its volunteer and those who may read every écoute', () => {
    assert.deepEqual(ids({channelId: 'chan42', assignedUserId: 'vol', isPermanence: false}), ['vol', 'ref', 'owner']);
    assert.deepEqual(ids({channelId: 'chan43', assignedUserId: null, isPermanence: false}), ['ref', 'owner']);
});

test('members of open channels: every active account, never banned, blocked or bot accounts', () => {
    const everyone = ['vol', 'vol2', 'ref', 'redac', 'owner'];
    assert.deepEqual(ids({channelId: '1', assignedUserId: null, isPermanence: false}), everyone);
    assert.deepEqual(ids({channelId: 'perm1', assignedUserId: null, isPermanence: true}), everyone);
});
