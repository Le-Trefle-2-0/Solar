import {test} from 'node:test';
import assert from 'node:assert/strict';
import {archiveNote, canArchiveWithoutTransmission} from './ticketClosing.js';

test('closing without transmission: managers only, and only when nobody was assigned', () => {
    assert.equal(canArchiveWithoutTransmission(['tickets.attribute', 'tickets.close'], null), true);
    assert.equal(canArchiveWithoutTransmission(['admin.sudo'], null), true);
    // An assigned écoute waits for its volunteer's transmission
    assert.equal(canArchiveWithoutTransmission(['tickets.attribute'], 'vol'), false);
    assert.equal(canArchiveWithoutTransmission(['tickets.close', 'tickets.read_all'], null), false);
});

test('closing without transmission: who and why, shown in the history', () => {
    assert.equal(archiveNote('Dominique'), 'Écoute fermée sans attribution par Dominique.');
    assert.equal(archiveNote('Dominique', '  Personne partie avant la prise en charge '),
        'Écoute fermée sans attribution par Dominique. Motif : Personne partie avant la prise en charge');
});
