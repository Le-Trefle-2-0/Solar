import {test} from 'node:test';
import assert from 'node:assert/strict';
import {withOtherCategory} from './ticketCategories.js';

test('transmission categories: "Autres" always offered, last, once', () => {
    assert.deepEqual(withOtherCategory(['Solitude', 'Stress']), ['Solitude', 'Stress', 'Autres']);
    assert.deepEqual(withOtherCategory([]), ['Autres']);
    assert.deepEqual(withOtherCategory(null), ['Autres']);
    // Already set by hand, in any form: not twice, and moved last
    assert.deepEqual(withOtherCategory(['autre', 'Solitude', ' Autres ']), ['Solitude', 'Autres']);
    assert.deepEqual(withOtherCategory(['Solitude', 3, '', null]), ['Solitude', 'Autres']);
});
