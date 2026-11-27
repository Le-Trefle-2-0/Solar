import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canActOnOthers, partHours} from './planning';

test('part hours: halves of the permanence, not fixed times', () => {
    const start = new Date(2026, 11, 3, 20, 0);
    assert.equal(partHours(start, new Date(2026, 11, 3, 23, 0), 'first'), '20h00-21h30');
    assert.equal(partHours(start, new Date(2026, 11, 3, 23, 0), 'second'), '21h30-23h00');
    assert.equal(partHours(new Date(2026, 11, 3, 18, 0), new Date(2026, 11, 3, 22, 0), 'second'), '20h00-22h00');
});

test('acting on others: _user only for slots of a role held, _all everywhere', () => {
    const can = (held: string[]) => (p: string) => held.includes(p);
    assert.equal(canActOnOthers(can(['permanence.register_other_user']), ['BE'], 'BE', 'register'), true);
    assert.equal(canActOnOthers(can(['permanence.register_other_user']), ['BE'], 'RBE', 'register'), false);
    assert.equal(canActOnOthers(can(['permanence.unregister_other_all']), [], 'RBE', 'unregister'), true);
    assert.equal(canActOnOthers(can(['permanence.unregister_other_all']), [], 'RBE', 'register'), false);
});
