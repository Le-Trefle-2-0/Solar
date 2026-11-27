import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyChannels, DEFAULT_HELP_CHANNEL_ID, envChannels, loadConfig} from './config.js';

const env = {
    DISCORD_TOKEN: 't', DISCORD_GUILD_ID: '818807139295297546', SOLAR_BOT_API_KEY: 'k',
    DISCORD_OPENING_CHANNEL_ID: '111111111111111111', DISCORD_ANNOUNCE_CHANNEL_ID: '222222222222222222',
};

test('config: the channels may all be set in Solar instead of the .env', () => {
    const cfg = loadConfig({DISCORD_TOKEN: 't', DISCORD_GUILD_ID: '818807139295297546', SOLAR_BOT_API_KEY: 'k'});
    assert.equal(cfg.openingChannelId, null);
    assert.equal(cfg.links.helpChannelId, DEFAULT_HELP_CHANNEL_ID);
    assert.throws(() => loadConfig({DISCORD_TOKEN: 't'}), /DISCORD_GUILD_ID, SOLAR_BOT_API_KEY/);
});

test('config: Solar wins, empty fields use the .env, changes are reported', () => {
    const cfg = loadConfig(env);
    const fromEnv = envChannels(env);
    const links = cfg.links;

    const changed = applyChannels(cfg, {
        openingChannelId: '885276175696547890', openingMessageId: '885276306223276052',
        announceChannelId: null, voiceChannelId: 'not-an-id', helpChannelId: '333333333333333333',
    }, fromEnv);
    assert.deepEqual([...changed].sort(), ['helpChannelId', 'openingChannelId', 'openingMessageId']);
    assert.equal(cfg.openingChannelId, '885276175696547890');
    assert.equal(cfg.openingMessageId, '885276306223276052');
    assert.equal(cfg.announceChannelId, '222222222222222222');
    assert.equal(cfg.voiceChannelId, null);
    // Same object: the relay keeps a reference to it
    assert.equal(cfg.links, links);
    assert.equal(links.helpChannelId, '333333333333333333');

    // Unchanged settings: nothing to apply again
    assert.equal(applyChannels(cfg, {
        openingChannelId: '885276175696547890', openingMessageId: '885276306223276052', helpChannelId: '333333333333333333',
    }, fromEnv).size, 0);

    // Solar unreachable at start-up: the .env values
    const fresh = loadConfig(env);
    assert.equal(applyChannels(fresh, null, fromEnv).size, 0);
    assert.equal(fresh.openingChannelId, '111111111111111111');
});
