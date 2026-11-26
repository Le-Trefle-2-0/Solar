import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import type {Actor} from '../../lib/roleAssignment.js';
import {registerRolesRoutes, type RolesRouteDeps} from './roles.js';

type Role = {id: string; name: string; weight: number; permissions: string[]; icon: string | null};

function setup(actor: Actor | null) {
    const roles: Role[] = [
        {id: 'r-admin', name: 'admin', weight: 100, permissions: ['admin.sudo'], icon: null},
        {id: 'r-manager', name: 'manager', weight: 50, permissions: ['roles.manage', 'tickets.read_all'], icon: null},
        {id: 'r-volunteer', name: 'volunteer', weight: 10, permissions: ['tickets.send_message'], icon: null},
        {id: 'r-training', name: 'training', weight: 5, permissions: [], icon: null},
        {id: 'r-none', name: 'none', weight: 0, permissions: [], icon: 'Ban'},
    ];
    const users = new Map([
        ['owner', {id: 'owner', role: 'none', isOwner: true}],
        ['v1', {id: 'v1', role: 'volunteer', isOwner: false}],
        ['m2', {id: 'm2', role: 'manager', isOwner: false}],
    ]);
    const log: string[] = [];
    const deps: RolesRouteDeps = {
        authenticate: async () => actor?.id ?? null,
        getActor: async () => actor,
        listRoles: async () => roles.map(r => ({...r})),
        findUser: async (id) => users.get(id) ?? null,
        saveRole: async (existing, data) => {
            log.push(`save:${existing?.name ?? 'new'}->${data.name}`);
            if (existing) {
                Object.assign(roles.find(r => r.id === existing.id)!, data);
                return {...existing, ...data};
            }
            const role = {id: `r-${data.name}`, ...data};
            roles.push(role);
            return role;
        },
        deleteRole: async (role) => {
            log.push(`delete:${role.name}`);
        },
        setWeights: async (updates) => {
            log.push(`weights:${updates.map(u => `${u.id}=${u.weight}`).join(',')}`);
        },
        setUserRoles: async (id, r) => {
            log.push(`assign:${id}=${r.join(',')}`);
            return {id, role: r.join(',')};
        },
        notify: async () => {
            log.push('notify');
        },
        resetRoles: async () => {
            log.push('reset');
        },
    };
    const app = Fastify();
    return {app, deps, log, ready: registerRolesRoutes(app, deps)};
}

const manager: Actor = {id: 'mgr', isOwner: false, roles: ['manager'], permissions: ['roles.manage', 'tickets.read_all']};
const volunteer: Actor = {id: 'v1', isOwner: false, roles: ['volunteer'], permissions: ['tickets.send_message']};
const owner: Actor = {id: 'owner', isOwner: true, roles: ['none'], permissions: ['admin.sudo']};

async function call(actor: Actor | null, method: 'GET' | 'POST' | 'DELETE', url: string, payload?: object) {
    const s = setup(actor);
    await s.ready;
    const res = await s.app.inject({method, url, payload});
    return {status: res.statusCode, body: res.statusCode === 200 ? res.json() : res.body, log: s.log};
}

test('roles: 401 without a session', async () => {
    assert.equal((await call(null, 'GET', '/v1/admin/roles')).status, 401);
    assert.equal((await call(null, 'POST', '/v1/admin/roles', {name: 'x', weight: 1, permissions: []})).status, 401);
});

test('roles: any member can list roles and sees what they may manage', async () => {
    const {status, body} = await call(volunteer, 'GET', '/v1/admin/roles');
    assert.equal(status, 200);
    // The hidden default role is not listed
    assert.deepEqual(body.roles.map((r: {name: string}) => r.name), ['admin', 'manager', 'volunteer', 'training']);
    assert.deepEqual(body.me, {isOwner: false, rank: 10, permissions: ['tickets.send_message']});
    assert.equal((await call(owner, 'GET', '/v1/admin/roles')).body.me.rank, null);
});

test('roles: create needs roles.manage and stays below the creator', async () => {
    assert.equal((await call(volunteer, 'POST', '/v1/admin/roles', {name: 'x', weight: 1, permissions: []})).status, 403);
    assert.equal((await call(manager, 'POST', '/v1/admin/roles', {name: 'x', weight: 60, permissions: []})).status, 403);
    const ok = await call(manager, 'POST', '/v1/admin/roles', {name: 'Référent', weight: 20, permissions: '["tickets.read_all"]', icon: 'Star'});
    assert.equal(ok.status, 200);
    assert.deepEqual(ok.log, ['save:new->Référent', 'notify']);
});

test('roles: a permission the creator lacks cannot be granted', async () => {
    const res = await call(manager, 'POST', '/v1/admin/roles', {name: 'x', weight: 20, permissions: ['admin.sudo']});
    assert.equal(res.status, 403);
    assert.deepEqual(res.log, []);
});

test('roles: renaming goes through saveRole (which updates the users holding it)', async () => {
    const res = await call(manager, 'POST', '/v1/admin/roles', {id: 'r-volunteer', name: 'bénévole', weight: 10, permissions: ['tickets.send_message']});
    assert.equal(res.status, 200);
    assert.deepEqual(res.log, ['save:volunteer->bénévole', 'notify']);
});

test('roles: unknown id is 404, duplicate name is 409', async () => {
    assert.equal((await call(owner, 'POST', '/v1/admin/roles', {id: 'nope', name: 'x', weight: 1, permissions: []})).status, 404);
    assert.equal((await call(owner, 'POST', '/v1/admin/roles', {name: 'volunteer', weight: 1, permissions: []})).status, 409);
});

test('roles: delete respects the hierarchy and protects the default role', async () => {
    assert.equal((await call(manager, 'DELETE', '/v1/admin/roles/r-admin')).status, 403);
    assert.equal((await call(owner, 'DELETE', '/v1/admin/roles/r-none')).status, 400);
    const ok = await call(manager, 'DELETE', '/v1/admin/roles/r-volunteer');
    assert.equal(ok.status, 200);
    assert.deepEqual(ok.log, ['delete:volunteer', 'notify']);
});

test('roles: reorder only within the roles below the caller', async () => {
    const ok = await call(manager, 'POST', '/v1/admin/roles/reorder', {ids: ['r-training', 'r-volunteer']});
    assert.equal(ok.status, 200);
    assert.deepEqual(ok.log, ['weights:r-training=10,r-volunteer=5', 'notify']);
    assert.equal((await call(manager, 'POST', '/v1/admin/roles/reorder', {ids: ['r-volunteer', 'r-manager', 'r-training']})).status, 403);
});

test('roles: assigning requires roles.manage and respects ranks and ownership', async () => {
    assert.equal((await call(volunteer, 'POST', '/v1/admin/users/v1/role', {roles: ['none']})).status, 403);
    assert.equal((await call(manager, 'POST', '/v1/admin/users/m2/role', {roles: ['volunteer']})).status, 403);
    assert.equal((await call(manager, 'POST', '/v1/admin/users/owner/role', {roles: ['volunteer']})).status, 403);
    assert.equal((await call(manager, 'POST', '/v1/admin/users/v1/role', {roles: 'volunteer'})).status, 400);
    assert.equal((await call(manager, 'POST', '/v1/admin/users/ghost/role', {roles: ['none']})).status, 404);
    const ok = await call(manager, 'POST', '/v1/admin/users/v1/role', {roles: ['none']});
    assert.equal(ok.status, 200);
    assert.deepEqual(ok.log, ['assign:v1=none', 'notify']);
});

test('roles: an empty selection removes every role (stored as the default role)', async () => {
    const ok = await call(manager, 'POST', '/v1/admin/users/v1/role', {roles: []});
    assert.equal(ok.status, 200);
    assert.deepEqual(ok.log, ['assign:v1=none', 'notify']);
});

test('roles: only the owner can reset to the default configuration', async () => {
    assert.equal((await call(null, 'POST', '/v1/admin/roles/reset')).status, 401);
    const admin: Actor = {id: 'adm', isOwner: false, roles: ['admin'], permissions: ['admin.sudo']};
    const refused = await call(admin, 'POST', '/v1/admin/roles/reset');
    assert.equal(refused.status, 403);
    assert.deepEqual(refused.log, []);
    const ok = await call(owner, 'POST', '/v1/admin/roles/reset');
    assert.equal(ok.status, 200);
    assert.deepEqual(ok.log, ['reset', 'notify']);
});
