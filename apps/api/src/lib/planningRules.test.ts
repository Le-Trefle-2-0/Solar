import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canActOnOthers, planSlotChanges, registrationDeadline} from './planningRules.js';

test('deadline: Monday 12:00 Paris time of the event week, in winter and summer', () => {
    // Thursday 26 November 2026, 20:00 Paris (UTC+1)
    assert.equal(registrationDeadline(new Date('2026-11-26T19:00:00Z')).toISOString(), '2026-11-23T11:00:00.000Z');
    // Sunday 5 July 2026, 22:00 Paris (UTC+2): same week, Monday 29 June
    assert.equal(registrationDeadline(new Date('2026-07-05T20:00:00Z')).toISOString(), '2026-06-29T10:00:00.000Z');
    // Monday 30 March 2026 just after midnight Paris, which is still Sunday in UTC
    assert.equal(registrationDeadline(new Date('2026-03-29T22:30:00Z')).toISOString(), '2026-03-30T10:00:00.000Z');
    // A Sunday event the day of the switch to summer time: Monday was still winter time
    assert.equal(registrationDeadline(new Date('2026-03-29T18:00:00Z')).toISOString(), '2026-03-23T11:00:00.000Z');
});

test('acting on others: _all on any slot, _user only on slots of a role the person holds', () => {
    const peer = {id: 'a', roles: ['Bénévole Écoutant'], permissions: ['permanence.register_other_user']};
    assert.equal(canActOnOthers(peer, 'Bénévole Écoutant', 'register'), true);
    assert.equal(canActOnOthers(peer, 'Référent', 'register'), false);
    assert.equal(canActOnOthers(peer, 'Bénévole Écoutant', 'unregister'), false);
    const all = {id: 'b', roles: [], permissions: ['permanence.unregister_other_all']};
    assert.equal(canActOnOthers(all, 'Référent', 'unregister'), true);
    assert.equal(canActOnOthers(all, 'Référent', 'register'), false);
    assert.equal(canActOnOthers({id: 'c', roles: [], permissions: ['admin.sudo']}, 'x', 'register'), true);
    assert.equal(canActOnOthers({id: 'd', roles: ['x'], permissions: []}, 'x', 'register'), false);
});

test('slot edits: create, update and delete, but never move a slot that has registrations', () => {
    const existing = [
        {id: 's1', role: 'BE', part: 'first', registrations: 2},
        {id: 's2', role: 'BE', part: 'second', registrations: 0},
        {id: 's3', role: 'RBE', part: null, registrations: 0},
    ];
    assert.deepEqual(planSlotChanges(existing, [
        {id: 's1', role: 'BE', goalCount: 4, part: 'first'},
        {id: 's2', role: 'RBE', goalCount: 1, part: null},
        {role: 'BE', goalCount: 2, part: 'second'},
    ]), {
        create: [{role: 'BE', goalCount: 2, part: 'second'}],
        update: [{id: 's1', role: 'BE', goalCount: 4, part: 'first'}, {id: 's2', role: 'RBE', goalCount: 1, part: null}],
        remove: ['s3'],
    });
    assert.ok('error' in planSlotChanges(existing, [{id: 's1', role: 'BE', goalCount: 3, part: 'second'}]));
    assert.ok('error' in planSlotChanges(existing, [{id: 'other', role: 'BE', goalCount: 3}]));
    assert.ok('error' in planSlotChanges(existing, [{id: 's2', role: 'BE', goalCount: 1, part: 'second'}, {id: 's2', role: 'BE', goalCount: 1, part: 'second'}]));
    assert.ok('error' in planSlotChanges(existing, []));
});
