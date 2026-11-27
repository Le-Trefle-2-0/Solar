import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {randomBytes} from 'crypto';
import {getActor, hasPermission} from '../../lib/permissions.js';
import {broadcast} from '../../lib/broadcast.js';
import {
    discordBotSettingsSchema,
    emptyDiscordBotSettings,
    envDiscordBotSettings,
    readDiscordBotSettings,
    writeDiscordBotSettings,
} from '../../lib/discordBotSettings.js';

/** Bot management is technical configuration: settings.manage (held by admin.sudo and the owner too). */
async function checkAdmin(req: any, reply: any) {
    const userId = await authenticate(req);
    const actor = userId ? await getActor(userId) : null;
    if (!actor) {
        return reply.status(401).send('unauthorized');
    }
    if (!hasPermission(actor.permissions, 'settings.manage')) {
        return reply.status(403).send('forbidden: settings.manage required');
    }
    return actor;
}

export async function registerBotRoutes(app: FastifyInstance) {
    app.get('/v1/bot/status', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;

        const botUser = await prisma.user.findFirst({
            // The bot account is recognised by its id, not by a role name that can be renamed
            where: {id: {startsWith: 'bot_'}}
        });

        if (!botUser) {
            return reply.send({exists: false});
        }

        const apiKey = await prisma.apikey.findFirst({
            where: {
                userId: botUser.id,
                enabled: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Check real-time connection via WS microservice
        let isConnected = false;
        try {
            let base = process.env.WS_INTERNAL_URL || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
            if (base.startsWith('ws://')) base = 'http://' + base.slice('ws://'.length);
            if (base.startsWith('wss://')) base = 'https://' + base.slice('wss://'.length);

            // The WebSocket service only answers internal callers (#216)
            const wsRes = await fetch(`${base}/bot-status?userId=${encodeURIComponent(botUser.id)}`, {
                headers: {Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`},
            }).then(r => r.json());
            isConnected = !!wsRes.isConnected;
        } catch (e) {
            // fallback to updatedAt if WS check fails
            isConnected = botUser.updatedAt > new Date(Date.now() - 5 * 60 * 1000);
        }

        return reply.send({
            exists: true,
            bot: {
                id: botUser.id,
                name: botUser.name,
                email: botUser.email,
                role: botUser.role,
                updatedAt: botUser.updatedAt,
                isConnected,
            },
            hasKey: !!apiKey
        });
    });

    // Channels and message of the Discord bot; an empty field uses the .env value (`fallback`)
    app.get('/v1/bot/discord-settings', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;
        return reply.send({settings: await readDiscordBotSettings(), fallback: envDiscordBotSettings()});
    });

    app.put('/v1/bot/discord-settings', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;
        const parsed = discordBotSettingsSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
            return reply.status(400).send({error: 'invalid_ids', fields: parsed.error.issues.map(i => i.path[0])});
        }
        const settings = {...emptyDiscordBotSettings(), ...parsed.data};
        await writeDiscordBotSettings(settings);
        // The bot applies them right away (it also reads them again when it reconnects)
        await broadcast(null, 'botSettings', {updatedAt: Date.now()}, {audience: 'bots'});
        return reply.send({settings, fallback: envDiscordBotSettings()});
    });

    app.post('/v1/bot/setup', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;

        let botUser = await prisma.user.findFirst({
            // The bot account is recognised by its id, not by a role name that can be renamed
            where: {id: {startsWith: 'bot_'}}
        });

        if (!botUser) {
            botUser = await prisma.user.create({
                data: {
                    id: `bot_${randomBytes(16).toString('hex')}`,
                    name: 'Solar Bot',
                    email: 'bot@solar.local',
                    emailVerified: true,
                    role: 'bot',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
        }

        const keyString = `sk_bot_${randomBytes(24).toString('hex')}`;
        const apiKey = await prisma.apikey.create({
            data: {
                id: `key_${randomBytes(16).toString('hex')}`,
                key: keyString,
                name: 'Solar Bot Key',
                userId: botUser.id,
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });

        return reply.send({
            success: true,
            bot: botUser,
            apiKey: keyString
        });
    });
}
