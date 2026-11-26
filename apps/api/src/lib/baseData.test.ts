import {test} from 'node:test';
import assert from 'node:assert/strict';
import {type BaseDataDb, ensureBaseData, PUBLIC_CHANNEL, TICKET_STATUSES} from './baseData.js';

function fakeDb(existingStatuses: string[] = [], existingChannels: string[] = []) {
    const statuses = new Map(existingStatuses.map(n => [n, 'edited label']));
    const channels = new Set(existingChannels);
    const db: BaseDataDb = {
        ticketStatus: {
            upsert: async ({where, create}) => {
                if (!statuses.has(where.name)) statuses.set(create.name, create.label);
            },
        },
        channel: {
            upsert: async ({where}) => {
                channels.add(where.id);
            },
        },
    };
    return {db, statuses, channels};
}

test('base data: every status the ticket routes look up is created on an empty database', async () => {
    const {db, statuses, channels} = fakeDb();
    await ensureBaseData(db);
    for (const name of ['waiting', 'started', 'closed', 'commented']) assert.ok(statuses.has(name), name);
    assert.ok(channels.has(PUBLIC_CHANNEL.id));
});

test('base data: existing rows are kept as they are, and running twice is harmless', async () => {
    const {db, statuses} = fakeDb(['waiting'], ['1']);
    await ensureBaseData(db);
    await ensureBaseData(db);
    assert.equal(statuses.get('waiting'), 'edited label');
    assert.equal(statuses.size, TICKET_STATUSES.length);
});
