import test from 'node:test';
import assert from 'node:assert/strict';
import {documentsToDelete, ORPHAN_UPLOAD_AGE_MS} from './documentRetention';

test('documents: the current ones stay; replaced ones go at once, unattached uploads after a day', () => {
    const now = Date.now();
    const recent = new Date(now - 60_000);
    const old = new Date(now - ORPHAN_UPLOAD_AGE_MS - 1);
    const uploads = [
        {id: 'current', createdAt: old},
        {id: 'replaced', createdAt: recent},
        {id: 'just-uploaded', createdAt: recent},
        {id: 'abandoned', createdAt: old},
    ];
    assert.deepEqual(documentsToDelete(uploads, new Set(['current']), new Set(['replaced']), now), ['replaced', 'abandoned']);
});
