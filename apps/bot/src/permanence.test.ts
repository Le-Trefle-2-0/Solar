import {test} from 'node:test';
import assert from 'node:assert/strict';
import {changed, nextCheckDelay, PermanenceWatcher, POLL_MS, viewOf, type PermanenceView} from './permanence.js';
import type {PermanenceStatus} from './solar.js';
import {openingMessage} from './texts.js';

const links = {helpChannelId: '718250345951658064', siteUrl: 'https://letrefle.org', inviteUrl: 'https://discord.gg/letrefle'};
const next = {start: '2026-11-27T19:00:00.000Z', end: '2026-11-27T22:00:00.000Z'};

test('changes: open/closed or another next permanence', () => {
    const closed = viewOf({open: false, nextOpening: next});
    assert.equal(changed(null, closed), true);
    assert.equal(changed(closed, viewOf({open: false, nextOpening: next})), false);
    assert.equal(changed(closed, viewOf({open: false, nextOpening: null})), true);
    assert.equal(changed(closed, viewOf({open: true, closesAt: next.end})), true);
});

test('next check: at the opening or closing time when it comes before the minute', () => {
    const now = new Date(next.start).getTime() - 10_000;
    assert.equal(nextCheckDelay(viewOf({open: false, nextOpening: next}), now), 11_000);
    assert.equal(nextCheckDelay(viewOf({open: false, nextOpening: null}), now), POLL_MS);
    assert.equal(nextCheckDelay(viewOf({open: true, closesAt: next.end}), now), POLL_MS);
});

test('watcher: applies on change only, announces an opening seen while running', async () => {
    let status: PermanenceStatus = {open: false, nextOpening: next};
    const applied: {open: boolean; opened: boolean}[] = [];
    const watcher = new PermanenceWatcher(
        {permanence: async () => status},
        async (view: PermanenceView, {opened}) => void applied.push({open: view.open, opened}),
        {log: () => undefined, warn: () => undefined},
    );
    await watcher.tick();
    await watcher.tick();
    status = {open: true, closesAt: next.end};
    await watcher.tick();
    watcher.stop();
    assert.deepEqual(applied, [{open: false, opened: false}, {open: true, opened: true}]);
});

test('opening message: same texts and button as before, next permanence when closed', () => {
    const open = openingMessage(true, null, links);
    assert.match(open.embeds[0].data.description!, /La permanence est actuellement ouverte/);
    const button = open.components[0].components[0].data as {custom_id?: string; label?: string};
    assert.equal(button.custom_id, 'OpenTicket');
    assert.equal(button.label, 'Ouvrir une écoute');

    const closed = openingMessage(false, next, links);
    assert.match(closed.embeds[0].data.description!, /La permanence est actuellement fermée ! La prochaine permanence aura lieu <t:\d+:F>/);
    assert.match(closed.embeds[0].data.description!, /<#718250345951658064>/);
    assert.equal(closed.components.length, 0);
    assert.match(openingMessage(false, null, links).embeds[0].data.description!, /pas encore programmée/);
});
