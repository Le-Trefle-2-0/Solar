import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
    avatarOf,
    displayNameOf,
    downloadAvatar,
    fetchDiscordProfile,
    planPersonSync,
    type DiscordDeps,
    type SyncablePerson,
} from './discordProfiles.js';

const ID = '123456789012345678';
const GUILD = '223456789012345678';
const user = {id: ID, username: 'camille_42', global_name: 'Camille', avatar: 'abc'};

test('name: server nickname, then display name, then user name', () => {
    assert.equal(displayNameOf(user, {nick: 'Camille (CA)'}), 'Camille (CA)');
    assert.equal(displayNameOf(user, {nick: null}), 'Camille');
    assert.equal(displayNameOf({...user, global_name: null}), 'camille_42');
});

test('avatar: server avatar, then account avatar (gif when animated), then the default one', () => {
    assert.deepEqual(avatarOf(user, GUILD, {avatar: 'srv'}),
        {url: `https://cdn.discordapp.com/guilds/${GUILD}/users/${ID}/avatars/srv.png?size=256`, hash: 'guild:srv'});
    assert.deepEqual(avatarOf({...user, avatar: 'a_anim'}, GUILD, {avatar: null}),
        {url: `https://cdn.discordapp.com/avatars/${ID}/a_anim.gif?size=256`, hash: 'user:a_anim'});
    const fallback = avatarOf({...user, avatar: null}, null);
    assert.match(fallback.url, /^https:\/\/cdn\.discordapp\.com\/embed\/avatars\/[0-5]\.png$/);
    assert.match(fallback.hash, /^default:[0-5]$/);
});

function deps(responses: Record<string, {status: number; body?: unknown}>, token = 'tok'): DiscordDeps & {calls: string[]} {
    const calls: string[] = [];
    return {
        token,
        guildId: GUILD,
        sleep: async () => undefined,
        calls,
        fetch: (async (url: string) => {
            calls.push(url.replace('https://discord.com/api/v10', ''));
            const queue = responses[url.replace('https://discord.com/api/v10', '')];
            const r = Array.isArray(queue) ? queue.shift() : queue;
            return new Response(r?.body === undefined ? null : JSON.stringify(r.body), {status: r?.status ?? 500});
        }) as typeof fetch,
    };
}

test('profile: member of the server, else the account, else not found', async () => {
    const asMember = deps({[`/guilds/${GUILD}/members/${ID}`]: {status: 200, body: {nick: 'Cam', avatar: null, user}}});
    assert.deepEqual(await fetchDiscordProfile(ID, asMember),
        {displayName: 'Cam', avatarUrl: `https://cdn.discordapp.com/avatars/${ID}/abc.png?size=256`, avatarHash: 'user:abc'});

    const notMember = deps({[`/guilds/${GUILD}/members/${ID}`]: {status: 404}, [`/users/${ID}`]: {status: 200, body: user}});
    assert.equal((await fetchDiscordProfile(ID, notMember)).displayName, 'Camille');

    const unknown = deps({[`/guilds/${GUILD}/members/${ID}`]: {status: 404}, [`/users/${ID}`]: {status: 404}});
    await assert.rejects(fetchDiscordProfile(ID, unknown), {code: 'not_found'});
    await assert.rejects(fetchDiscordProfile(ID, {...deps({}), token: undefined}), {code: 'no_token'});
    await assert.rejects(fetchDiscordProfile('not-an-id', deps({})), {code: 'not_found'});
});

test('profile: waits once when Discord rate limits', async () => {
    const limited = deps({
        [`/guilds/${GUILD}/members/${ID}`]: [{status: 429, body: {retry_after: 0.1}}, {status: 200, body: {user}}] as any,
    });
    assert.equal((await fetchDiscordProfile(ID, limited)).displayName, 'Camille');
    assert.equal(limited.calls.length, 2);
});

test('photo download: only Discord CDN images, as a data URL', async () => {
    const png = (async () => new Response(new Uint8Array([1, 2, 3]), {status: 200, headers: {'content-type': 'image/png'}})) as typeof fetch;
    assert.equal(await downloadAvatar('https://cdn.discordapp.com/avatars/1/a.png', {fetch: png}), 'data:image/png;base64,AQID');
    await assert.rejects(downloadAvatar('https://evil.example/a.png', {fetch: png}));
    const html = (async () => new Response('<html>', {status: 200, headers: {'content-type': 'text/html'}})) as typeof fetch;
    await assert.rejects(downloadAvatar('https://cdn.discordapp.com/avatars/1/a.png', {fetch: html}));
});

const person: SyncablePerson = {
    id: 'p1', name: 'Camille', image: 'data:old', discordId: ID, syncName: true, syncImage: true, discordAvatarHash: 'user:abc',
};
const profile = {displayName: 'Camille D.', avatarUrl: 'https://cdn.discordapp.com/avatars/x/new.png', avatarHash: 'user:new'};
const now = new Date(0);
const download = async () => 'data:new';
const free = async () => false;

test('sync: only fields that follow Discord, photo only when the avatar changed', async () => {
    assert.deepEqual(await planPersonSync(person, profile, free, download, {now}),
        {discordSyncedAt: now, discordSyncError: null, name: 'Camille D.', image: 'data:new', discordAvatarHash: 'user:new'});

    // Customised name and photo stay as they are
    assert.deepEqual(await planPersonSync({...person, syncName: false, syncImage: false}, profile, free, download, {now}),
        {discordSyncedAt: now, discordSyncError: null});

    // Same avatar: nothing downloaded, unless forced
    let downloads = 0;
    const counting = async () => (downloads++, 'data:new');
    await planPersonSync(person, {...profile, avatarHash: 'user:abc'}, free, counting, {now});
    assert.equal(downloads, 0);
    await planPersonSync(person, {...profile, avatarHash: 'user:abc'}, free, counting, {now, forceImage: true});
    assert.equal(downloads, 1);
});

test('sync: a name already used by someone else is kept and reported', async () => {
    const update = await planPersonSync({...person, syncImage: false}, profile, async () => true, download, {now});
    assert.equal(update.name, undefined);
    assert.match(update.discordSyncError!, /déjà utilisé/);
});
