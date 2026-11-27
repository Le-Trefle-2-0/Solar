import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyTwoFactorGate, BASIC_PERMISSIONS} from './twoFactorGate.js';
import {ALL_PERMISSIONS} from './permissionCatalogue.js';
import {resolveActor} from './permissions.js';
import {DEFAULT_ROLES} from './defaultRoles.js';

const ok = {banned: false, banExpires: null, documentsStatus: 'validated', documentsRenewalAt: null};
const roleRows = DEFAULT_ROLES.map(r => ({name: r.name, permissions: JSON.stringify(r.permissions)}));
const actor = (role: string, twoFactorEnabled: boolean | null, id = 'u1', ownerId: string | null = null) =>
    resolveActor({id, role, twoFactorEnabled, ...ok}, ownerId, roleRows)!;

test('with 2FA, an account keeps every permission of its roles', () => {
    assert.deepEqual(applyTwoFactorGate(['roles.manage', 'tickets.close'], true),
        {permissions: ['roles.manage', 'tickets.close'], needsTwoFactor: false});
});

test('without 2FA, privileged permissions are withheld and admin.sudo leaves only the basic ones', () => {
    assert.deepEqual(applyTwoFactorGate(['roles.manage', 'tickets.close'], false),
        {permissions: ['tickets.close'], needsTwoFactor: true});
    assert.deepEqual(applyTwoFactorGate(['admin.sudo'], false),
        {permissions: [...ALL_PERMISSIONS].filter(p => BASIC_PERMISSIONS.includes(p)), needsTwoFactor: true});
});

test('default roles: volunteers work without 2FA, managers, board and editors do not', () => {
    for (const name of ['Bénévole Écoutant', 'Bénévole en formation']) {
        const a = actor(name, null);
        assert.equal(a.needsTwoFactor, false, name);
        assert.deepEqual(a.permissions, DEFAULT_ROLES.find(r => r.name === name)!.permissions, name);
    }
    for (const name of ['Conseil d\'Administration', 'Responsable pôle écoutes', 'Administrateur Système',
        'Référent Bénévole Écoutant', 'Rédacteur']) {
        const a = actor(name, false);
        assert.equal(a.needsTwoFactor, true, name);
        assert.ok(a.permissions.every(p => BASIC_PERMISSIONS.includes(p as never)), name);
        assert.equal(actor(name, true).needsTwoFactor, false, name);
    }
});

test('the owner needs 2FA too', () => {
    assert.equal(actor('none', null, 'boss', 'boss').permissions.includes('admin.sudo'), false);
    assert.equal(actor('none', true, 'boss', 'boss').permissions.includes('admin.sudo'), true);
});

test('the bot account has its own authentication and needs no 2FA', () => {
    assert.ok(actor('bot', null, 'bot_1').permissions.includes('tickets.read_all'));
    assert.ok(!actor('bot', null, 'human').permissions.includes('tickets.read_all'));
});

test('the API and web lists of basic permissions are identical', async () => {
    const web: any = await import('../../../web/lib/twoFactorGate.ts' as string);
    assert.deepEqual(web.BASIC_PERMISSIONS ?? web.default?.BASIC_PERMISSIONS, [...BASIC_PERMISSIONS]);
});
