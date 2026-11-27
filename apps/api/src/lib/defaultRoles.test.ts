import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_ROLES} from './defaultRoles.js';
import {DEFAULT_ROLE, isKnownPermission} from './permissionCatalogue.js';
import {hasPermission, isValidRoleName} from './roleAssignment.js';

const role = (name: string) => {
    const found = DEFAULT_ROLES.find(r => r.name === name);
    assert.ok(found, `missing default role ${name}`);
    return found;
};

test('default roles: valid unique names, distinct weights, known permissions', () => {
    const names = DEFAULT_ROLES.map(r => r.name);
    assert.equal(new Set(names).size, names.length);
    assert.ok(names.every(isValidRoleName));
    const weights = DEFAULT_ROLES.map(r => r.weight);
    assert.equal(new Set(weights).size, weights.length);
    for (const r of DEFAULT_ROLES) {
        assert.ok(r.permissions.every(isKnownPermission), r.name);
        assert.equal(new Set(r.permissions).size, r.permissions.length, r.name);
    }
});

test('default roles: hierarchy, highest first', () => {
    assert.deepEqual(DEFAULT_ROLES.map(r => r.name), [
        "Conseil d'Administration", 'Responsable pôle écoutes', 'Administrateur Système',
        'Référent Bénévole Écoutant', 'Rédacteur', 'bot', 'Bénévole Écoutant', 'Bénévole en formation', DEFAULT_ROLE,
    ]);
    const weights = DEFAULT_ROLES.map(r => r.weight);
    assert.deepEqual(weights, [...weights].sort((a, b) => b - a));
});

test('board has every access; the department head everything but sudo', () => {
    assert.deepEqual(role("Conseil d'Administration").permissions, ['admin.sudo']);
    const head = role('Responsable pôle écoutes').permissions;
    assert.equal(head.includes('admin.sudo'), false);
    for (const p of ['roles.manage', 'management.manage_accounts', 'tickets.read_all', 'settings.manage']) {
        assert.ok(head.includes(p as any), p);
    }
});

test('system administrator: technical access only, no listening content nor documents', () => {
    const sys = role('Administrateur Système').permissions;
    assert.ok(hasPermission(sys, 'settings.manage'));
    for (const p of ['tickets.read_all', 'tickets.send_message_all', 'management.manage_accounts', 'roles.manage', 'admin.sudo']) {
        assert.equal(hasPermission(sys, p), false, p);
    }
});

test('listening manager: runs the planning, assigns and can step into any ticket', () => {
    const ref = role('Référent Bénévole Écoutant').permissions;
    for (const p of ['tickets.attribute', 'tickets.read_all', 'tickets.send_message_all', 'permanence.open',
        'permanence.close', 'permanence.register_other_all', 'permanence.unregister_other_all']) {
        assert.ok(ref.includes(p as any), p);
    }
    assert.equal(ref.includes('roles.manage' as any), false);
});

test('listening volunteer: assigned tickets and own planning sign-up only', () => {
    const vol = role('Bénévole Écoutant').permissions;
    for (const p of ['tickets.send_message', 'permanence.register', 'permanence.unregister']) assert.ok(vol.includes(p as any), p);
    for (const p of ['tickets.read_all', 'tickets.send_message_all', 'tickets.attribute', 'permanence.open']) {
        assert.equal(vol.includes(p as any), false, p);
    }
});

test('volunteer in training: observes écoutes, never takes or writes in one', () => {
    const trainee = role('Bénévole en formation').permissions;
    for (const p of ['tickets.spectate', 'permanence.register', 'permanence.unregister']) assert.ok(trainee.includes(p as any), p);
    for (const p of ['tickets.send_message', 'tickets.close', 'tickets.read_all', 'tickets.send_message_all', 'tickets.attribute']) {
        assert.equal(trainee.includes(p as any), false, p);
    }
    assert.equal(role('Bénévole Écoutant').permissions.includes('tickets.spectate'), false);
});

test('writer: newsletters only; default role: nothing', () => {
    assert.deepEqual(role('Rédacteur').permissions, ['newsletters.manage']);
    assert.deepEqual(role(DEFAULT_ROLE).permissions, []);
});

test('fresh install: only the hidden default role (created by a migration) means "no roles yet"', async () => {
    const {needsDefaultRoles} = await import('./seed.js');
    assert.equal(needsDefaultRoles([]), true);
    assert.equal(needsDefaultRoles([DEFAULT_ROLE]), true);
    assert.equal(needsDefaultRoles([DEFAULT_ROLE, 'Bénévole Écoutant']), false);
});
