/**
 * Names and photos of team members imported from Discord, for the showcase of the public home
 * page. Uses the bot's token (DISCORD_TOKEN): on the association's server (DISCORD_GUILD_ID)
 * the server nickname and server avatar win, otherwise the account's own.
 *
 * Photos are downloaded and stored like the ones set by hand, so visitors' browsers never
 * contact Discord; a photo is downloaded again only when the avatar changed.
 */

const API = 'https://discord.com/api/v10';
const CDN = 'https://cdn.discordapp.com';
export const DISCORD_ID = /^\d{15,22}$/;
const MAX_AVATAR_BYTES = 1024 * 1024;
const AVATAR_TYPES = new Set(['image/png', 'image/gif', 'image/webp', 'image/jpeg']);

export type DiscordUser = {id: string; username: string; global_name?: string | null; avatar?: string | null};
export type DiscordMember = {nick?: string | null; avatar?: string | null; user?: DiscordUser};

export type DiscordProfile = {
    displayName: string;
    avatarUrl: string;
    /** Identifies the avatar: unchanged hash, nothing to download. */
    avatarHash: string;
};

export class DiscordProfileError extends Error {
    constructor(readonly code: 'no_token' | 'not_found' | 'unavailable', message: string) {
        super(message);
    }
}

/** Server nickname, then display name, then user name. */
export function displayNameOf(user: DiscordUser, member?: DiscordMember | null): string {
    return (member?.nick || user.global_name || user.username).trim().slice(0, 191);
}

/** Server avatar, then account avatar, then Discord's default one. */
export function avatarOf(user: DiscordUser, guildId: string | null, member?: DiscordMember | null): {url: string; hash: string} {
    const ext = (hash: string) => (hash.startsWith('a_') ? 'gif' : 'png');
    if (member?.avatar && guildId) {
        return {url: `${CDN}/guilds/${guildId}/users/${user.id}/avatars/${member.avatar}.${ext(member.avatar)}?size=256`, hash: `guild:${member.avatar}`};
    }
    if (user.avatar) return {url: `${CDN}/avatars/${user.id}/${user.avatar}.${ext(user.avatar)}?size=256`, hash: `user:${user.avatar}`};
    const index = Number((BigInt(user.id) >> 22n) % 6n);
    return {url: `${CDN}/embed/avatars/${index}.png`, hash: `default:${index}`};
}

export interface DiscordDeps {
    token: string | undefined;
    guildId: string | null;
    fetch: typeof fetch;
    sleep: (ms: number) => Promise<void>;
}

export const defaultDiscordDeps = (): DiscordDeps => ({
    token: process.env.DISCORD_TOKEN?.trim() || undefined,
    guildId: process.env.DISCORD_GUILD_ID && DISCORD_ID.test(process.env.DISCORD_GUILD_ID) ? process.env.DISCORD_GUILD_ID : null,
    fetch,
    sleep: (ms) => new Promise(r => setTimeout(r, ms)),
});

/** GET on the Discord API; waits once when rate limited. Null on 404. */
async function discordGet<T>(deps: DiscordDeps, path: string): Promise<T | null> {
    for (let attempt = 0; attempt < 2; attempt++) {
        const res = await deps.fetch(`${API}${path}`, {
            headers: {Authorization: `Bot ${deps.token}`},
            signal: AbortSignal.timeout(10_000),
        });
        if (res.status === 404) return null;
        if (res.status === 429 && attempt === 0) {
            const body = await res.json().catch(() => ({})) as {retry_after?: number};
            await deps.sleep(Math.min(30, body.retry_after ?? 1) * 1000);
            continue;
        }
        if (!res.ok) throw new DiscordProfileError('unavailable', `Discord a répondu ${res.status}`);
        return await res.json() as T;
    }
    throw new DiscordProfileError('unavailable', 'Discord limite les requêtes, réessayez plus tard');
}

export async function fetchDiscordProfile(discordId: string, deps: DiscordDeps = defaultDiscordDeps()): Promise<DiscordProfile> {
    if (!deps.token) throw new DiscordProfileError('no_token', 'Le bot Discord n\'est pas configuré (DISCORD_TOKEN)');
    if (!DISCORD_ID.test(discordId)) throw new DiscordProfileError('not_found', 'Identifiant Discord invalide');

    const member = deps.guildId ? await discordGet<DiscordMember>(deps, `/guilds/${deps.guildId}/members/${discordId}`) : null;
    const user = member?.user ?? await discordGet<DiscordUser>(deps, `/users/${discordId}`);
    if (!user) throw new DiscordProfileError('not_found', 'Aucun compte Discord avec cet identifiant');

    const avatar = avatarOf(user, deps.guildId, member);
    return {displayName: displayNameOf(user, member), avatarUrl: avatar.url, avatarHash: avatar.hash};
}

/** The avatar as a data URL, like photos set by hand. Only images from Discord's CDN, at most 1 MB. */
export async function downloadAvatar(url: string, deps: Pick<DiscordDeps, 'fetch'> = {fetch}): Promise<string> {
    if (!url.startsWith(`${CDN}/`)) throw new DiscordProfileError('unavailable', 'Adresse de photo inattendue');
    const res = await deps.fetch(url, {signal: AbortSignal.timeout(15_000)});
    const type = (res.headers.get('content-type') || '').split(';')[0].trim();
    if (!res.ok || !AVATAR_TYPES.has(type)) throw new DiscordProfileError('unavailable', 'Photo Discord indisponible');
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > MAX_AVATAR_BYTES) throw new DiscordProfileError('unavailable', 'Photo Discord trop lourde');
    return `data:${type};base64,${bytes.toString('base64')}`;
}

export type SyncablePerson = {
    id: string;
    name: string;
    image: string | null;
    discordId: string | null;
    syncName: boolean;
    syncImage: boolean;
    discordAvatarHash: string | null;
};

export type PersonUpdate = {
    name?: string;
    image?: string;
    discordAvatarHash?: string;
    discordSyncedAt: Date;
    discordSyncError: string | null;
};

/**
 * What a resync changes: only the fields that follow Discord, the photo only when the avatar
 * changed (or `forceImage`). `nameTaken` tells whether another person already has that name
 * (names are unique): the name is then kept and the problem reported.
 */
export async function planPersonSync(
    person: SyncablePerson,
    profile: DiscordProfile,
    nameTaken: (name: string) => Promise<boolean>,
    download: (url: string) => Promise<string>,
    {forceImage = false, now = new Date()}: {forceImage?: boolean; now?: Date} = {},
): Promise<PersonUpdate> {
    const update: PersonUpdate = {discordSyncedAt: now, discordSyncError: null};
    if (person.syncName && profile.displayName && profile.displayName !== person.name) {
        if (await nameTaken(profile.displayName)) {
            update.discordSyncError = `Le nom « ${profile.displayName} » est déjà utilisé par une autre personne`;
        } else {
            update.name = profile.displayName;
        }
    }
    if (person.syncImage && (forceImage || !person.image || profile.avatarHash !== person.discordAvatarHash)) {
        update.image = await download(profile.avatarUrl);
        update.discordAvatarHash = profile.avatarHash;
    }
    return update;
}
