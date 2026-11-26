import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
    type Actor,
    checkRoleAssignment,
    checkRoleDelete,
    checkRoleEdit,
    isValidRoleName,
    type KnownRole,
    planReorder,
    rankOf,
    renameInRoleString,
} from './roleAssignment.js';

const knownRoles: KnownRole[] = [
    {id: 'r-admin', name: 'admin', weight: 100, permissions: ['admin.sudo']},
    {id: 'r-manager', name: 'manager', weight: 50, permissions: ['roles.manage', 'tickets.read_all', 'management.manage_accounts']},
    {id: 'r-volunteer', name: 'volunteer', weight: 10, permissions: ['tickets.send_message']},
    {id: 'r-none', name: 'none', weight: 0, permissions: []},
];

const owner: Actor = {id: 'owner', isOwner: true, roles: ['none'], permissions: ['admin.sudo']};
const admin: Actor = {id: 'adm', isOwner: false, roles: ['admin'], permissions: ['admin.sudo']};
const manager: Actor = {id: 'mgr', isOwner: false, roles: ['manager'], permissions: ['roles.manage', 'tickets.read_all', 'management.manage_accounts']};
const volunteer: Actor = {id: 'vol', isOwner: false, roles: ['volunteer'], permissions: ['tickets.send_message']};

// ---- rank ----

test('rank: owner is above every role, others rank at their highest role', () => {
    assert.equal(rankOf(true, [], knownRoles), Infinity);
    assert.equal(rankOf(false, ['volunteer', 'manager'], knownRoles), 50);
    assert.equal(rankOf(false, [], knownRoles), -Infinity);
    assert.equal(rankOf(false, ['deleted-role'], knownRoles), -Infinity);
});

// ---- assignment ----

const assign = (actor: Actor, target: {id?: string; isOwner?: boolean; roles: string[]}, requested: unknown) =>
    checkRoleAssignment({
        actor, requested, knownRoles,
        target: {id: target.id ?? 'target', isOwner: target.isOwner ?? false, roles: target.roles},
    })?.status ?? 200;

test('assign: a manager gives and removes roles below their own', () => {
    assert.equal(assign(manager, {roles: ['none']}, ['volunteer']), 200);
    assert.equal(assign(manager, {roles: ['volunteer']}, ['none']), 200);
});

test('assign: a manager cannot hand out their own rank or above', () => {
    assert.equal(assign(manager, {roles: ['volunteer']}, ['manager']), 403);
    assert.equal(assign(manager, {roles: ['volunteer']}, ['admin']), 403);
});

test('assign: a manager cannot touch users of equal or higher rank', () => {
    assert.equal(assign(manager, {roles: ['manager']}, ['manager', 'volunteer']), 403);
    assert.equal(assign(manager, {roles: ['admin']}, ['volunteer']), 403);
});

test('assign: on themself, a manager may change lower roles but not their top role', () => {
    assert.equal(assign(manager, {id: 'mgr', roles: ['manager']}, ['manager', 'volunteer']), 200);
    assert.equal(assign(manager, {id: 'mgr', roles: ['manager']}, ['admin']), 403);
    assert.equal(assign(manager, {id: 'mgr', roles: ['manager']}, ['volunteer']), 403);
});

test('assign: the owner cannot be managed by anyone else, even an admin', () => {
    assert.equal(assign(admin, {id: 'owner', isOwner: true, roles: ['none']}, ['volunteer']), 403);
    assert.equal(assign(owner, {id: 'owner', isOwner: true, roles: ['none']}, ['admin']), 200);
});

test('assign: the owner can assign any role, including admin', () => {
    assert.equal(assign(owner, {roles: ['volunteer']}, ['admin']), 200);
});

test('assign: admin.sudo does not lift the hierarchy', () => {
    assert.equal(assign(admin, {roles: ['admin']}, ['volunteer']), 403);
    assert.equal(assign(admin, {roles: ['volunteer']}, ['admin']), 403);
    assert.equal(assign(admin, {roles: ['volunteer']}, ['manager']), 200);
});

test('assign: empty, unknown, padded, comma-joined or duplicate roles are refused', () => {
    for (const requested of [[], [''], ['ghost'], [' volunteer'], ['volunteer,admin'], ['volunteer', 'volunteer'], 'volunteer', null]) {
        assert.equal(assign(owner, {roles: ['none']}, requested), 400, JSON.stringify(requested));
    }
});

test('assign: a stale role (since deleted) can always be dropped', () => {
    assert.equal(assign(manager, {roles: ['volunteer', 'ghost']}, ['volunteer']), 200);
});

// ---- role edit ----

const edit = (actor: Actor, existing: KnownRole | null, requested: {name?: unknown; weight?: unknown; permissions?: unknown}, nameTaken = false) =>
    checkRoleEdit({
        actor, knownRoles, existing, nameTaken,
        requested: {name: 'helper', weight: 20, permissions: [], ...requested},
    })?.status ?? 200;

const volunteerRole = knownRoles[2];
const managerRole = knownRoles[1];
const noneRole = knownRoles[3];

test('edit: roles.manage is required', () => {
    assert.equal(edit(volunteer, null, {weight: 5}), 403);
    assert.equal(edit(manager, null, {}), 200);
});

test('edit: only roles strictly below your rank, and they stay below it', () => {
    const keep = {name: 'volunteer', permissions: ['tickets.send_message']};
    // Permissions unchanged: holding them is not needed to move or rename the role
    assert.equal(edit(manager, volunteerRole, {...keep, weight: 49}), 200);
    assert.equal(edit(owner, volunteerRole, {...keep, weight: 49}), 200);
    assert.equal(edit(manager, {...volunteerRole, permissions: []}, {name: 'volunteer', weight: 49}), 200);
    assert.equal(edit(manager, {...volunteerRole, permissions: []}, {name: 'volunteer', weight: 50}), 403);
    assert.equal(edit(manager, managerRole, {name: 'manager', weight: 40}), 403);
    assert.equal(edit(manager, null, {weight: 60}), 403);
    assert.equal(edit(owner, null, {weight: 1000}), 200);
});

test('edit: you can only grant or remove permissions you hold', () => {
    assert.equal(edit(manager, null, {permissions: ['tickets.read_all']}), 200);
    assert.equal(edit(manager, null, {permissions: ['admin.sudo']}), 403);
    assert.equal(edit(manager, null, {permissions: ['newsletters.manage']}), 403);
    // Removing a permission you do not hold is refused too
    const withNewsletter = {...volunteerRole, permissions: ['tickets.send_message', 'newsletters.manage']};
    assert.equal(edit(manager, withNewsletter, {name: 'volunteer', permissions: ['tickets.send_message']}), 403);
    // Keeping it untouched while changing something else is fine
    assert.equal(edit(manager, withNewsletter, {name: 'bénévole', permissions: ['tickets.send_message', 'newsletters.manage']}), 200);
    assert.equal(edit(manager, {...withNewsletter, permissions: ['newsletters.manage']}, {name: 'volunteer', permissions: ['newsletters.manage', 'tickets.read_all']}), 200);
});

test('edit: sudo and owner can grant anything below them', () => {
    assert.equal(edit(admin, null, {weight: 99, permissions: ['admin.sudo', 'roles.manage']}), 200);
    assert.equal(edit(owner, null, {weight: 500, permissions: ['admin.sudo']}), 200);
});

test('edit: invalid names, weights, permissions and duplicate names are refused', () => {
    assert.equal(edit(owner, null, {name: ''}), 400);
    assert.equal(edit(owner, null, {name: 'a,b'}), 400);
    assert.equal(edit(owner, null, {weight: '5'}), 400);
    assert.equal(edit(owner, null, {weight: 1.5}), 400);
    assert.equal(edit(owner, null, {permissions: ['made.up']}), 400);
    assert.equal(edit(owner, null, {permissions: ['tickets.open', 'tickets.open']}), 400);
    assert.equal(edit(owner, null, {}, true), 409);
});

test('edit: the default role keeps its name and never gets permissions', () => {
    assert.equal(edit(owner, noneRole, {name: 'none', weight: 0, icon: 'Ban'} as any), 200);
    assert.equal(edit(owner, noneRole, {name: 'guest', weight: 0}), 400);
    assert.equal(edit(owner, noneRole, {name: 'none', weight: 0, permissions: ['tickets.open']}), 400);
    assert.equal(edit(owner, null, {name: 'none'}), 400);
});

test('edit: the stored weight is used, not one sent by the caller', () => {
    // existing comes from the database: a manager cannot edit admin by claiming a low weight
    assert.equal(edit(manager, knownRoles[0], {name: 'admin', weight: 1}), 403);
});

// ---- delete ----

test('delete: below your rank only, with roles.manage, never the default role', () => {
    assert.equal(checkRoleDelete(manager, volunteerRole, knownRoles), null);
    assert.equal(checkRoleDelete(manager, managerRole, knownRoles)?.status, 403);
    assert.equal(checkRoleDelete(volunteer, noneRole, knownRoles)?.status, 400);
    assert.equal(checkRoleDelete(owner, noneRole, knownRoles)?.status, 400);
    assert.equal(checkRoleDelete({...volunteer, roles: ['manager']}, volunteerRole, knownRoles)?.status, 403);
});

// ---- reorder ----

test('reorder: reuses the weights already below the actor', () => {
    const plan = planReorder(manager, knownRoles, ['r-none', 'r-volunteer']);
    assert.ok('updates' in plan);
    assert.deepEqual(plan.updates, [{id: 'r-none', weight: 10}, {id: 'r-volunteer', weight: 0}]);
});

test('reorder: refuses roles at or above the actor, missing or unknown roles', () => {
    assert.ok('refusal' in planReorder(manager, knownRoles, ['r-manager', 'r-volunteer', 'r-none']));
    assert.ok('refusal' in planReorder(manager, knownRoles, ['r-volunteer']));
    assert.ok('refusal' in planReorder(manager, knownRoles, ['r-volunteer', 'r-ghost']));
    assert.ok('refusal' in planReorder(volunteer, knownRoles, ['r-none']));
});

test('reorder: ties are broken so the order is kept', () => {
    const tied: KnownRole[] = [
        {id: 'a', name: 'a', weight: 10}, {id: 'b', name: 'b', weight: 10}, {id: 'c', name: 'c', weight: 10},
    ];
    const plan = planReorder(owner, tied, ['c', 'a', 'b']);
    assert.ok('updates' in plan);
    assert.deepEqual(plan.updates.map(u => u.weight), [10, 9, 8]);
});

test('reorder: the owner reorders every role', () => {
    const plan = planReorder(owner, knownRoles, ['r-manager', 'r-admin', 'r-volunteer', 'r-none']);
    assert.ok('updates' in plan);
    assert.deepEqual(plan.updates.map(u => u.weight), [100, 50, 10, 0]);
});

// ---- helpers ----

test('role names must be non-empty, trimmed and comma-free', () => {
    for (const bad of ['', ' ', ' x', 'x ', 'a,b', 'x'.repeat(65), null, 3]) assert.equal(isValidRoleName(bad), false);
    for (const good of ['volunteer', 'none', 'Référent']) assert.equal(isValidRoleName(good), true);
});

test('renaming or removing a role inside role strings', () => {
    assert.equal(renameInRoleString('volunteer,manager', 'manager', 'référent'), 'volunteer,référent');
    assert.equal(renameInRoleString('manager', 'manager', null), 'none');
    assert.equal(renameInRoleString('a,manager,b', 'manager', null), 'a,b');
    assert.equal(renameInRoleString('managers', 'manager', null), 'managers');
    assert.equal(renameInRoleString('a,b', 'a', 'b'), 'b');
});
