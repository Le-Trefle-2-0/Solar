import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const entry = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../index.ts');

test('ws refuses to start without WS_BROADCAST_SECRET', () => {
    const env = {...process.env, WS_GUEST_SECRET: 'x', INTERNAL_API_SECRET: 'y', WS_BROADCAST_SECRET: ''};
    const r = spawnSync(process.execPath, ['--import', 'tsx', entry], {env, encoding: 'utf8', timeout: 20000});
    assert.equal(r.status, 1);
    assert.match(r.stderr, /WS_BROADCAST_SECRET/);
});
