import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {randomBytes} from 'crypto';

async function checkAdmin(req: any, reply: any) {
    const userId = await authenticate(req);

    if (!userId) {
        return reply.status(401).send('unauthorized');
    }

    const user = await prisma.user.findUnique({where: {id: userId}});
    if (!user) {
        return reply.status(401).send('unauthorized');
    }

    const userRoles = (user.role || "").split(",").map((r: string) => r.trim());
    const isAuthorized = userRoles.includes("admin");

    if (!isAuthorized) {
        return reply.status(401).send('unauthorized');
    }
    return user;
}

export async function registerBotRoutes(app: FastifyInstance) {
    app.get('/v1/bot/status', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;

        const botUser = await prisma.user.findFirst({
            where: {
                role: {
                    contains: 'bot'
                }
            }
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

            const wsRes = await fetch(`${base}/bot-status?userId=${botUser.id}`).then(r => r.json());
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

    app.post('/v1/bot/setup', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;

        let botUser = await prisma.user.findFirst({
            where: {
                role: {
                    contains: 'bot'
                }
            }
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
