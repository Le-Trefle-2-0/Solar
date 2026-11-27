import {z} from 'zod';
import {prisma} from '../prisma.js';

/**
 * Discord channels and message the bot (apps/bot) works with, set in Solar's settings page.
 * An empty field falls back to the root .env (DISCORD_*_ID), so an existing set-up keeps working.
 */

export const DISCORD_BOT_SETTING_KEY = 'discord_bot';

export const DISCORD_BOT_FIELDS = {
    openingChannelId: 'DISCORD_OPENING_CHANNEL_ID',
    openingMessageId: 'DISCORD_OPENING_MESSAGE_ID',
    announceChannelId: 'DISCORD_ANNOUNCE_CHANNEL_ID',
    voiceChannelId: 'DISCORD_VOICE_CHANNEL_ID',
    helpChannelId: 'DISCORD_HELP_CHANNEL_ID',
} as const;

export type DiscordBotField = keyof typeof DISCORD_BOT_FIELDS;
export type DiscordBotSettings = Record<DiscordBotField, string | null>;

const DISCORD_ID = /^\d{15,22}$/;
const fields = Object.keys(DISCORD_BOT_FIELDS) as DiscordBotField[];

const idOrEmpty = z.union([z.string().trim().regex(DISCORD_ID), z.literal(''), z.null()])
    .optional()
    .transform(v => (v ? v : null));

export const discordBotSettingsSchema = z.object(
    Object.fromEntries(fields.map(f => [f, idOrEmpty])) as Record<DiscordBotField, typeof idOrEmpty>,
).strict();

export const emptyDiscordBotSettings = (): DiscordBotSettings =>
    Object.fromEntries(fields.map(f => [f, null])) as DiscordBotSettings;

/** Stored value, anything unexpected ignored. */
export function parseDiscordBotSettings(value: string | null | undefined): DiscordBotSettings {
    const settings = emptyDiscordBotSettings();
    if (!value) return settings;
    try {
        const raw = JSON.parse(value) as Record<string, unknown>;
        for (const f of fields) {
            const v = raw?.[f];
            if (typeof v === 'string' && DISCORD_ID.test(v)) settings[f] = v;
        }
    } catch {
        // Unreadable: as if nothing was set
    }
    return settings;
}

/** Values of the .env used when a field is empty, shown in the settings page. */
export function envDiscordBotSettings(env: NodeJS.ProcessEnv = process.env): DiscordBotSettings {
    const settings = emptyDiscordBotSettings();
    for (const f of fields) {
        const v = env[DISCORD_BOT_FIELDS[f]]?.trim();
        if (v && DISCORD_ID.test(v)) settings[f] = v;
    }
    return settings;
}

export async function readDiscordBotSettings(): Promise<DiscordBotSettings> {
    const row = await prisma.settings.findUnique({where: {key: DISCORD_BOT_SETTING_KEY}});
    return parseDiscordBotSettings(row?.value);
}

export async function writeDiscordBotSettings(settings: DiscordBotSettings) {
    const value = JSON.stringify(settings);
    await prisma.settings.upsert({
        where: {key: DISCORD_BOT_SETTING_KEY},
        update: {value},
        create: {key: DISCORD_BOT_SETTING_KEY, value},
    });
}
