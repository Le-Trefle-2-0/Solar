/**
 * What Solar asks Discord while the bot is set up (Administration > Paramètres > Bot Discord):
 * who the token belongs to, the servers the bot is on, their channels and the bot's own
 * messages, so nothing has to be copied from Discord except the token.
 */

const API = 'https://discord.com/api/v10';
const CDN = 'https://cdn.discordapp.com';

export class DiscordSetupError extends Error {
    constructor(readonly code: 'invalid_token' | 'forbidden' | 'not_found' | 'unavailable', message: string) {
        super(message);
    }
}

/** GET on the Discord API with the bot token. Null on 404. */
export type DiscordGet = <T>(path: string) => Promise<T | null>;

export function discordClient(
    token: string,
    {fetchImpl = fetch, sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))}: {fetchImpl?: typeof fetch; sleep?: (ms: number) => Promise<void>} = {},
): DiscordGet {
    return async <T>(path: string): Promise<T | null> => {
        for (let attempt = 0; attempt < 2; attempt++) {
            let res: Response;
            try {
                res = await fetchImpl(`${API}${path}`, {
                    headers: {Authorization: `Bot ${token}`},
                    signal: AbortSignal.timeout(10_000),
                });
            } catch {
                throw new DiscordSetupError('unavailable', 'Discord ne répond pas, réessayez dans un instant');
            }
            if (res.status === 401) throw new DiscordSetupError('invalid_token', 'Discord refuse ce jeton : vérifiez qu\'il est complet et à jour');
            if (res.status === 403) throw new DiscordSetupError('forbidden', 'Le bot n\'a pas accès à cet élément sur Discord');
            if (res.status === 404) return null;
            if (res.status === 429 && attempt === 0) {
                const body = await res.json().catch(() => ({})) as {retry_after?: number};
                await sleep(Math.min(10, body.retry_after ?? 1) * 1000);
                continue;
            }
            if (!res.ok) throw new DiscordSetupError('unavailable', `Discord a répondu ${res.status}`);
            return await res.json() as T;
        }
        throw new DiscordSetupError('unavailable', 'Discord limite les requêtes, réessayez dans un instant');
    };
}

/** Bot tokens: three base64url parts separated by dots. */
export const looksLikeToken = (token: string) => /^[\w-]{20,}\.[\w-]{4,}\.[\w-]{20,}$/.test(token);

export type BotIdentity = {applicationId: string; botUserId: string; botName: string; botAvatar: string | null};

export async function identify(get: DiscordGet): Promise<BotIdentity> {
    const user = await get<{id: string; username: string; global_name?: string | null; avatar: string | null; bot?: boolean}>('/users/@me');
    if (!user?.bot) throw new DiscordSetupError('invalid_token', 'Ce jeton n\'est pas celui d\'un bot');
    const app = await get<{id: string}>('/oauth2/applications/@me');
    return {
        applicationId: app?.id ?? user.id,
        botUserId: user.id,
        botName: user.global_name || user.username,
        botAvatar: user.avatar ? `${CDN}/avatars/${user.id}/${user.avatar}.png?size=128` : null,
    };
}

/**
 * What the bot does on the server: see and write in its channels with embeds and buttons, and
 * read the opening channel's history (to find its message again). Nothing more: voice calls
 * happen in Solar.
 */
export const BOT_PERMISSIONS = {
    ViewChannel: 1n << 10n,
    SendMessages: 1n << 11n,
    EmbedLinks: 1n << 14n,
    ReadMessageHistory: 1n << 16n,
};

export function inviteUrl(applicationId: string, guildId?: string | null): string {
    const permissions = Object.values(BOT_PERMISSIONS).reduce((a, b) => a | b, 0n);
    const params = new URLSearchParams({client_id: applicationId, scope: 'bot', permissions: String(permissions)});
    if (guildId) params.set('guild_id', guildId);
    return `https://discord.com/oauth2/authorize?${params}`;
}

export type GuildSummary = {id: string; name: string; iconUrl: string | null};

export async function listGuilds(get: DiscordGet): Promise<GuildSummary[]> {
    const guilds = await get<{id: string; name: string; icon: string | null}[]>('/users/@me/guilds?limit=200') ?? [];
    return guilds
        .map(g => ({id: g.id, name: g.name, iconUrl: g.icon ? `${CDN}/icons/${g.id}/${g.icon}.png?size=64` : null}))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

type RawChannel = {id: string; name: string; type: number; position: number; parent_id?: string | null};
export type ChannelSummary = {id: string; name: string; category: string | null};

const TEXT_TYPES = new Set([0, 5]); // text, announcement
const CATEGORY = 4;

/** Text channels of a server, in Discord's order (categories, then position). */
export async function listChannels(get: DiscordGet, guildId: string): Promise<{text: ChannelSummary[]}> {
    const channels = await get<RawChannel[]>(`/guilds/${guildId}/channels`);
    if (!channels) throw new DiscordSetupError('not_found', 'Le bot n\'est plus sur ce serveur');
    const categories = new Map(channels.filter(c => c.type === CATEGORY).map(c => [c.id, c]));
    const order = (c: RawChannel) => {
        const parent = c.parent_id ? categories.get(c.parent_id) : undefined;
        return [parent ? parent.position + 1 : 0, c.position];
    };
    const sorted = channels
        .filter(c => c.type !== CATEGORY)
        .sort((a, b) => {
            const [pa, ca] = order(a);
            const [pb, cb] = order(b);
            return pa - pb || ca - cb;
        });
    const summary = (c: RawChannel): ChannelSummary => ({
        id: c.id, name: c.name, category: c.parent_id ? categories.get(c.parent_id)?.name ?? null : null,
    });
    return {
        text: sorted.filter(c => TEXT_TYPES.has(c.type)).map(summary),
    };
}

export type BotMessage = {id: string; createdAt: string; preview: string};

/** Discord ids carry their creation date. */
export const snowflakeDate = (id: string) => new Date(Number((BigInt(id) >> 22n) + 1420070400000n));

/** The bot's own messages among the channel's last 100 (only those can be edited by the bot). */
export async function listBotMessages(
    get: DiscordGet,
    channelId: string,
    botUserId: string,
    channelNames: Map<string, string> = new Map(),
): Promise<BotMessage[]> {
    const messages = await get<{
        id: string;
        author: {id: string};
        content: string;
        embeds?: {title?: string; description?: string}[];
        components?: unknown[];
    }[]>(`/channels/${channelId}/messages?limit=100`);
    if (!messages) throw new DiscordSetupError('not_found', 'Salon introuvable');
    return messages
        .filter(m => m.author.id === botUserId)
        .map(m => {
            const embed = m.embeds?.[0];
            const text = (m.content || embed?.title || embed?.description || (m.components?.length ? 'Message avec boutons' : '…'))
                // Mentions as Discord shows them
                .replace(/<#(\d+)>/g, (_, id: string) => `#${channelNames.get(id) ?? 'salon'}`)
                .replace(/<@[!&]?\d+>/g, '@…')
                .replace(/\s+/g, ' ').trim();
            return {id: m.id, createdAt: snowflakeDate(m.id).toISOString(), preview: text.length > 140 ? `${text.slice(0, 139)}…` : text};
        });
}
