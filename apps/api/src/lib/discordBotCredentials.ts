import {randomBytes} from 'crypto';
import {prisma} from '../prisma.js';
import {open, seal} from './secretBox.js';
import type {BotIdentity} from './discordSetup.js';

/**
 * The Discord bot's credentials, set up from Solar: its Discord token (encrypted), the server
 * chosen for it, and its Solar account with API key. The bot process reads them through the
 * internal API (GET /v1/internal/bot/credentials), so nothing has to be copied into its .env.
 * DISCORD_TOKEN / DISCORD_GUILD_ID in the .env are still used while nothing is set up in Solar.
 */

export const CREDENTIALS_KEY = 'discord_bot_credentials';
const PURPOSE = 'discord-bot-token';

export type StoredCredentials = BotIdentity & {
    token: string;
    guildId: string | null;
    guildName: string | null;
};

type Row = Omit<StoredCredentials, 'token'> & {sealedToken: string};

async function readRow(): Promise<Row | null> {
    const row = await prisma.settings.findUnique({where: {key: CREDENTIALS_KEY}});
    if (!row) return null;
    try {
        const value = JSON.parse(row.value) as Row;
        return typeof value?.sealedToken === 'string' ? value : null;
    } catch {
        return null;
    }
}

async function writeRow(row: Row) {
    const value = JSON.stringify(row);
    await prisma.settings.upsert({where: {key: CREDENTIALS_KEY}, update: {value}, create: {key: CREDENTIALS_KEY, value}});
}

/** What is set up in Solar; `unreadable` when the token can no longer be decrypted (INTERNAL_API_SECRET changed). */
export async function readSetup(): Promise<{stored: StoredCredentials | null; unreadable: boolean}> {
    const row = await readRow();
    if (!row) return {stored: null, unreadable: false};
    const token = open(row.sealedToken, PURPOSE);
    if (!token) return {stored: null, unreadable: true};
    const {sealedToken: _sealed, ...rest} = row;
    return {stored: {...rest, token}, unreadable: false};
}

export async function saveToken(token: string, identity: BotIdentity, keepGuild: {guildId: string; guildName: string} | null) {
    await writeRow({
        ...identity,
        sealedToken: seal(token, PURPOSE),
        guildId: keepGuild?.guildId ?? null,
        guildName: keepGuild?.guildName ?? null,
    });
}

export async function saveGuild(guildId: string, guildName: string) {
    const row = await readRow();
    if (!row) throw new Error('no token');
    await writeRow({...row, guildId, guildName});
}

/** Token and server the bot and the team sync use: Solar's set-up, else the .env. */
export async function getDiscordCredentials(): Promise<{token: string; guildId: string | null} | null> {
    const {stored} = await readSetup().catch(() => ({stored: null}));
    if (stored) return {token: stored.token, guildId: stored.guildId};
    const token = process.env.DISCORD_TOKEN?.trim();
    if (!token) return null;
    const guildId = process.env.DISCORD_GUILD_ID?.trim();
    return {token, guildId: guildId && /^\d{15,22}$/.test(guildId) ? guildId : null};
}

// ---- Solar account of the bot ----

/** The bot account is recognised by its id, not by a role name that can be renamed. */
export const findBotAccount = () => prisma.user.findFirst({where: {id: {startsWith: 'bot_'}}});

export async function latestBotKey(userId: string) {
    return prisma.apikey.findFirst({
        where: {userId, enabled: true, OR: [{expiresAt: null}, {expiresAt: {gt: new Date()}}]},
        orderBy: {createdAt: 'desc'},
    });
}

async function createKey(userId: string) {
    const now = new Date();
    return prisma.apikey.create({
        data: {
            id: `key_${randomBytes(16).toString('hex')}`,
            key: `sk_bot_${randomBytes(24).toString('hex')}`,
            name: 'Solar Bot Key',
            userId,
            enabled: true,
            createdAt: now,
            updatedAt: now,
        },
    });
}

/** Creates the bot account and its API key when missing. The key is never shown: the bot fetches it. */
export async function ensureBotAccount() {
    let bot = await findBotAccount();
    if (!bot) {
        const now = new Date();
        bot = await prisma.user.create({
            data: {
                id: `bot_${randomBytes(16).toString('hex')}`,
                name: 'Solar Bot',
                email: 'bot@solar.local',
                emailVerified: true,
                role: 'bot',
                createdAt: now,
                updatedAt: now,
            },
        });
    }
    if (!await latestBotKey(bot.id)) await createKey(bot.id);
    return bot;
}

/** New key, previous ones disabled; the bot picks the new one up by itself. */
export async function rotateBotKey() {
    const bot = await ensureBotAccount();
    await prisma.apikey.updateMany({where: {userId: bot.id, enabled: true}, data: {enabled: false}});
    await createKey(bot.id);
    return bot;
}
