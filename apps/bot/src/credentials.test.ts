import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lookUpCredentials, sameCredentials} from './credentials.js';

const API = 'http://api.test';
const solar = {discordToken: 'tok', guildId: '818807139295297546', solarApiKey: 'sk_bot_x'};
const envCreds = {DISCORD_TOKEN: 'envtok', DISCORD_GUILD_ID: '818807139295297546', SOLAR_BOT_API_KEY: 'sk_env'};

const answering = (status: number, body: unknown, seen: {auth?: string} = {}) => (async (_url: string, init?: RequestInit) => {
    seen.auth = (init?.headers as Record<string, string>)?.Authorization;
    return new Response(JSON.stringify(body), {status});
}) as typeof fetch;

test('credentials: Solar\'s set-up, asked with the internal secret', async () => {
    const seen: {auth?: string} = {};
    const found = await lookUpCredentials(API, {INTERNAL_API_SECRET: 's3cret', ...envCreds}, answering(200, solar, seen));
    assert.deepEqual(found, {status: 'ok', credentials: solar, source: 'solar'});
    assert.equal(seen.auth, 'Bearer s3cret');
});

test('credentials: what is missing, or the .env of an older set-up', async () => {
    const missing = await lookUpCredentials(API, {INTERNAL_API_SECRET: 's'}, answering(404, {error: 'not_configured', missing: ['discord_token']}));
    assert.deepEqual(missing, {status: 'not_configured', missing: ['discord_token']});

    const fromEnv = await lookUpCredentials(API, {INTERNAL_API_SECRET: 's', ...envCreds}, answering(404, {error: 'not_configured', missing: []}));
    assert.equal(fromEnv.status === 'ok' && fromEnv.source, 'env');

    const down = (async () => {
        throw new Error('ECONNREFUSED');
    }) as typeof fetch;
    assert.equal((await lookUpCredentials(API, {INTERNAL_API_SECRET: 's'}, down)).status, 'unreachable');
    // Incomplete .env: not enough to start
    assert.equal((await lookUpCredentials(API, {DISCORD_TOKEN: 'x'}, down)).status, 'not_configured');
});

test('credentials: a restart only when something changed', () => {
    assert.ok(sameCredentials(solar, {...solar}));
    assert.ok(!sameCredentials(solar, {...solar, solarApiKey: 'rotated'}));
    assert.ok(!sameCredentials(null, solar));
});
