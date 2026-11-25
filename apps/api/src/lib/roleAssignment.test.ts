import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkRoleAssignment, checkRoleChange, type RoleAssignment} from './roleAssignment.js';

const knownRoles = [
    {name: 'admin', weight: 100},
    {name: 'manager', weight: 50},
    {name: 'volunteer', weight: 10},
];

const status = (over: Partial<RoleAssignment>) => checkRoleAssignment({
    callerRole: 'manager', targetRole: 'volunteer', requested: ['volunteer'], knownRoles, isSelf: false, ...over,
})?.status ?? 200;

test('a manager cannot give themself the admin role', () => {
    assert.equal(status({isSelf: true, targetRole: 'manager', requested: ['manager', 'admin']}), 403);
    assert.equal(status({isSelf: true, targetRole: 'manager', requested: ['admin']}), 403);
});

test('a manager cannot assign a role of equal or higher weight', () => {
    assert.equal(status({requested: ['admin']}), 403);
    assert.equal(status({requested: ['manager']}), 403);
});

test('a manager cannot change the roles of an admin or another manager', () => {
    assert.equal(status({targetRole: 'admin', requested: []}), 403);
    assert.equal(status({targetRole: 'manager', requested: ['volunteer']}), 403);
});

test('role names that would be read back as another role are rejected', () => {
    for (const requested of [['x,admin'], ['admin '], [' admin'], ['Admin'], ['unknown'], [42]]) {
        assert.equal(status({requested}), 400, JSON.stringify(requested));
        assert.equal(status({requested, callerRole: 'admin'}), 400, JSON.stringify(requested));
    }
});

test('a caller without any known role is refused', () => {
    assert.equal(status({callerRole: 'ghost'}), 403);
});

test('allowed assignments', () => {
    assert.equal(status({}), 200);
    assert.equal(status({requested: []}), 200);
    assert.equal(status({isSelf: true, targetRole: 'manager', requested: ['volunteer']}), 200);
    assert.equal(status({callerRole: 'admin', targetRole: 'manager', requested: ['admin']}), 200);
});

test('a manager cannot assign admin even if its weight was lowered', () => {
    const lowered = [{name: 'admin', weight: 1}, {name: 'manager', weight: 50}];
    assert.equal(status({knownRoles: lowered, targetRole: '', requested: ['admin']}), 403);
});

test('a manager cannot modify a role of equal or higher weight by sending a low one', () => {
    for (const existing of [{name: 'admin', weight: 100}, {name: 'lead', weight: 80}, {name: 'manager', weight: 50}]) {
        assert.notEqual(checkRoleChange(50, existing, {name: existing.name, weight: 1}), null, existing.name);
    }
});

test('a manager cannot create or raise a role to their level, or omit the weight', () => {
    const volunteer = {name: 'volunteer', weight: 10};
    for (const weight of [50, 90, undefined, '1', null]) {
        assert.notEqual(checkRoleChange(50, volunteer, {name: 'volunteer', weight}), null, String(weight));
    }
    assert.notEqual(checkRoleChange(50, null, {name: 'admin', weight: 1}), null);
});

test('a manager can manage lower roles', () => {
    assert.equal(checkRoleChange(50, {name: 'volunteer', weight: 10}, {name: 'volunteer', weight: 20}), null);
    assert.equal(checkRoleChange(50, null, {name: 'intern', weight: 5}), null);
});

