import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
    discordClient,
    identify,
    inviteUrl,
    listBotMessages,
    listChannels,
    listGuilds,
    looksLikeToken,
    snowflakeDate,
    type DiscordGet,
} from './discordSetup.js';
import {open, seal} from './secretBox.js';

const BOT = '1100000000000000001';
const fake = (routes: Record<string, unknown>): DiscordGet => async <T>(path: string) => (path in routes ? routes[path] as T : null);

test('secret box: readable with the same secret only', () => {
    const sealed = seal('MTEx.abc.def', 'discord-bot-token', 'secret-a');
    assert.ok(!sealed.includes('MTEx'));
    assert.equal(open(sealed, 'discord-bot-token', 'secret-a'), 'MTEx.abc.def');
    assert.equal(open(sealed, 'discord-bot-token', 'secret-b'), null);
    assert.equal(open(sealed, 'other-purpose', 'secret-a'), null);
    assert.equal(open('garbage', 'discord-bot-token', 'secret-a'), null);
});

test('token: shape checked before asking Discord, refused tokens explained', async () => {
    assert.ok(looksLikeToken('MTEwMDAwMDAwMDAwMDAwMDAwMQ.GaBcDe.abcdefghijklmnopqrstuvwxyz0123456789AB'));
    assert.ok(!looksLikeToken('https://discord.com/developers'));

    const unauthorized = discordClient('x', {fetchImpl: (async () => new Response(null, {status: 401})) as typeof fetch});
    await assert.rejects(identify(unauthorized), {code: 'invalid_token'});

    // A user account token is not a bot
    await assert.rejects(identify(fake({'/users/@me': {id: '1', username: 'someone', avatar: null}})), {code: 'invalid_token'});

    const me = await identify(fake({
        '/users/@me': {id: BOT, username: 'trefle-bot', global_name: 'Le Trèfle', avatar: 'abc', bot: true},
        '/oauth2/applications/@me': {id: '1100000000000000000'},
    }));
    assert.deepEqual(me, {
        applicationId: '1100000000000000000', botUserId: BOT, botName: 'Le Trèfle',
        botAvatar: `https://cdn.discordapp.com/avatars/${BOT}/abc.png?size=128`,
    });
});

test('invite link: the bot application with the permissions it uses', () => {
    const url = new URL(inviteUrl('1100000000000000000', '818807139295297546'));
    assert.equal(url.searchParams.get('client_id'), '1100000000000000000');
    assert.equal(url.searchParams.get('scope'), 'bot');
    assert.equal(url.searchParams.get('guild_id'), '818807139295297546');
    const permissions = BigInt(url.searchParams.get('permissions')!);
    assert.equal(permissions & (1n << 3n), 0n, 'never administrator');
    assert.notEqual(permissions & (1n << 11n), 0n, 'send messages');
    assert.equal(permissions & ((1n << 4n) | (1n << 28n)), 0n, 'no channel or role management');
});

test('servers and channels: names, categories and Discord order', async () => {
    const get = fake({
        '/users/@me/guilds?limit=200': [{id: '2', name: 'Zèbre', icon: null}, {id: '1', name: 'Le Trèfle', icon: 'i'}],
        '/guilds/1/channels': [
            {id: '10', name: 'ACCUEIL', type: 4, position: 0},
            {id: '11', name: 'ouvrir-une-ecoute', type: 0, position: 1, parent_id: '10'},
            {id: '12', name: 'annonces', type: 5, position: 0, parent_id: '10'},
            {id: '13', name: 'Écoute vocale', type: 2, position: 2, parent_id: '10'},
            {id: '14', name: 'règles', type: 0, position: 0},
        ],
    });
    assert.deepEqual((await listGuilds(get)).map(g => g.name), ['Le Trèfle', 'Zèbre']);
    const {text} = await listChannels(get, '1');
    // Voice channels are not offered: voice calls happen in Solar
    assert.deepEqual(text.map(c => c.name), ['règles', 'annonces', 'ouvrir-une-ecoute']);
    assert.equal(text[1].category, 'ACCUEIL');
    await assert.rejects(listChannels(get, '2'), {code: 'not_found'});
});

test('opening message: only the bot\'s own messages, with a preview and a date', async () => {
    const id = '885276306223276052';
    const get = fake({
        '/channels/5/messages?limit=100': [
            {id, author: {id: BOT}, content: '', embeds: [{description: '🔓 | La permanence est   ouverte ! <#7>'}]},
            {id: '885276306223276053', author: {id: 'someone'}, content: 'Salut'},
        ],
    });
    const messages = await listBotMessages(get, '5', BOT, new Map([['7', 'autres-supports']]));
    assert.equal(messages.length, 1);
    assert.equal(messages[0].preview, '🔓 | La permanence est ouverte ! #autres-supports');
    assert.equal(messages[0].createdAt, snowflakeDate(id).toISOString());
    assert.equal(snowflakeDate(id).getUTCFullYear(), 2021);
});
