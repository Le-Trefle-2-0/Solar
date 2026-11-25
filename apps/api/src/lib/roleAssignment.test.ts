import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkRoleAssignment, type RoleAssignment} from './roleAssignment.js';

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
