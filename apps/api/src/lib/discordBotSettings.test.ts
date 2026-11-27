import {test} from 'node:test';
import assert from 'node:assert/strict';
import {discordBotSettingsSchema, envDiscordBotSettings, parseDiscordBotSettings} from './discordBotSettings.js';

test('bot settings: Discord ids or empty, nothing else', () => {
    const ok = discordBotSettingsSchema.safeParse({openingChannelId: ' 885276175696547890 ', openingMessageId: '', announceChannelId: null});
    assert.ok(ok.success);
    assert.equal(ok.data.openingChannelId, '885276175696547890');
    assert.equal(ok.data.openingMessageId, null);
    assert.equal(ok.data.helpChannelId, null);
    // The former voice channel setting is gone (voice calls happen in Solar)
    assert.equal(discordBotSettingsSchema.safeParse({voiceChannelId: '885276175696547890'}).success, false);

    assert.equal(discordBotSettingsSchema.safeParse({openingChannelId: '#general'}).success, false);
    assert.equal(discordBotSettingsSchema.safeParse({token: '123456789012345678'}).success, false);
});

test('bot settings: stored value and .env fallback', () => {
    assert.deepEqual(parseDiscordBotSettings('{"openingChannelId":"885276175696547890","voiceChannelId":"x"}'), {
        openingChannelId: '885276175696547890', openingMessageId: null, announceChannelId: null, helpChannelId: null,
    });
    assert.equal(parseDiscordBotSettings('not json').openingChannelId, null);
    assert.equal(envDiscordBotSettings({DISCORD_ANNOUNCE_CHANNEL_ID: '818807139295297549'}).announceChannelId, '818807139295297549');
});
