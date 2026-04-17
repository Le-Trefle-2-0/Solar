import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import crypto from 'crypto';
import {broadcast} from '../../lib/broadcast.js';

const WIDGET_COOKIES = ['widget_channel', 'widget_uid', 'widget_exp', 'widget_sig', 'widget_public'];

function setWidgetCookie(reply: any, name: string, value: string, maxAgeSec = 60 * 60 * 24) {
    reply.setCookie(name, value, {
        path: '/',
        maxAge: maxAgeSec,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false, // Must be readable by client for WS auth
    });
}

function clearWidgetCookies(reply: any) {
    WIDGET_COOKIES.forEach(name => {
        reply.setCookie(name, '', {
            path: '/',
            maxAge: 0,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });
    });
}

export async function registerWidgetRoutes(app: FastifyInstance) {
    app.post('/v1/widget/session', async (req, reply) => {
        try {
            const visitorName = "utilisateur";
            const secret = process.env.WS_GUEST_SECRET || 'fallback_secret_for_dev_only';

            const body = (req.body ?? {}) as { name?: string, forceNew?: boolean };
            const forceNew = body.forceNew === true;

            let channelId = req.cookies.widget_channel || '';
            let uid = req.cookies.widget_uid || '';
            let expStr = req.cookies.widget_exp || '';
            let sig = req.cookies.widget_sig || '';

            if (forceNew) {
                clearWidgetCookies(reply);
                channelId = '';
                uid = '';
                expStr = '';
                sig = '';
            }

            if (channelId) {
                const ticket = await prisma.ticket.findUnique({where: {channelId}});
                if (!ticket) {
                    clearWidgetCookies(reply);
                    // Instead of failing, we will just proceed to create a new one below by clearing channelId
                    channelId = '';
                    uid = '';
                    expStr = '';
                    sig = '';
                } else {
                    // Valid existing ticket session, return immediately to avoid re-broadcasting updateRequest
                    const now = Date.now();
                    let exp = Number(expStr) || now + 24 * 60 * 60 * 1000;
                    if (!uid) uid = `guest_${crypto.randomUUID()}`;
                    if (exp <= now) exp = now + 24 * 60 * 60 * 1000;

                    const authBase = `${channelId}.${uid}.${exp}`;
                    const expectedSig = crypto.createHmac('sha256', secret).update(authBase).digest('hex');
                    if (sig !== expectedSig) sig = expectedSig;

                    setWidgetCookie(reply, 'widget_channel', channelId);
                    setWidgetCookie(reply, 'widget_uid', uid);
                    setWidgetCookie(reply, 'widget_exp', String(exp));
                    setWidgetCookie(reply, 'widget_sig', sig);
                    setWidgetCookie(reply, 'widget_public', '1');

                    // Make sure we also have a channel for this ticket
                    if (!ticket.channelId) {
                        // This is an edge case where ticket exists but channel doesn't
                        channelId = ''; // Force recreation
                    } else {
                        return reply.send({
                            success: true,
                            channelId,
                            ticketId: ticket.id,
                            credentials: {channelId, uid, exp, sig},
                            status: ticket.statusName
                        });
                    }
                }
            }

            if (!channelId) {
                const syntheticId = `web:${crypto.randomUUID()}`;
                const ua = req.headers['user-agent'] || 'unknown';

                const status = await prisma.ticketStatus.findUnique({where: {name: 'waiting'}});
                if (!status) return reply.status(500).send({success: false, error: 'status_missing'});

                const ticket = await prisma.ticket.create({
                    data: {
                        discordUserID: syntheticId,
                        source: 'web',
                        metadata: {userAgent: ua, visitorName},
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        statusName: status.name,
                        statusLabel: status.label,
                    },
                });

                let channelName = String(ticket.id).padStart(5, '0');
                channelName = 'Ticket-' + channelName;
                const channel = await prisma.channel.create({data: {name: channelName}});

                const updatedTicket = await prisma.ticket.update({
                    where: {id: ticket.id},
                    data: {
                        updatedAt: new Date(),
                        channelName: channel.name,
                        channelId: channel.id,
                    },
                });

                channelId = updatedTicket.channelId!;
                // Ensure cookies are set for the new session immediately
                const now = Date.now();
                const exp = now + 24 * 60 * 60 * 1000;
                if (!uid) uid = `guest_${crypto.randomUUID()}`;
                const authBase = `${channelId}.${uid}.${exp}`;
                sig = crypto.createHmac('sha256', secret).update(authBase).digest('hex');

                setWidgetCookie(reply, 'widget_channel', channelId);
                setWidgetCookie(reply, 'widget_uid', uid);
                setWidgetCookie(reply, 'widget_exp', String(exp));
                setWidgetCookie(reply, 'widget_sig', sig);
                setWidgetCookie(reply, 'widget_public', '1');

                await broadcast(null, 'updateRequest', {channelId});

                return reply.send({
                    success: true,
                    channelId,
                    ticketId: ticket.id,
                    credentials: {channelId, uid, exp, sig}
                });
            }

            // Fallback (should not be reached with the logic above)
            const now = Date.now();
            let exp = Number(expStr) || now + 24 * 60 * 60 * 1000;
            if (!uid) uid = `guest_${crypto.randomUUID()}`;
            if (exp <= now) exp = now + 24 * 60 * 60 * 1000;

            const authBase = `${channelId}.${uid}.${exp}`;
            const expectedSig = crypto.createHmac('sha256', secret).update(authBase).digest('hex');
            if (sig !== expectedSig) sig = expectedSig;

            setWidgetCookie(reply, 'widget_channel', channelId);
            setWidgetCookie(reply, 'widget_uid', uid);
            setWidgetCookie(reply, 'widget_exp', String(exp));
            setWidgetCookie(reply, 'widget_sig', sig);
            setWidgetCookie(reply, 'widget_public', '1');

            return reply.send({
                success: true,
                channelId,
                ticketId: ticket?.id,
                credentials: {channelId, uid, exp, sig}
            });
        } catch (e) {
            console.error('[widget] session error:', e);
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });

    app.post('/v1/widget/close', async (req, reply) => {
        try {
            const channelId = req.cookies.widget_channel;
            if (!channelId) return reply.status(401).send({success: false, error: 'no_active_session'});

            const ticket = await prisma.ticket.findUnique({where: {channelId}});
            if (!ticket) return reply.status(404).send({success: false, error: 'ticket_not_found'});

            if (ticket.statusName === 'closed' || ticket.statusName === 'commented') {
                clearWidgetCookies(reply);
                return reply.send({success: true, status: ticket.statusName});
            }

            // Perform closure logic
            const status = await prisma.ticketStatus.findUnique({where: {name: 'closed'}});
            if (!status) return reply.status(500).send({success: false, error: 'status_missing'});

            const updated = await prisma.ticket.update({
                where: {id: ticket.id},
                include: {status: true},
                data: {
                    statusName: status.name,
                    statusLabel: status.label,
                    // Anonymize the ticket on close to prevent linkage on reopen
                    discordUserID: crypto.createHash('sha256').update(ticket.discordUserID).digest('hex'),
                },
            });

            // Broadcast status update
            await broadcast(channelId, 'ticketStatusUpdate', {
                channelId,
                statusId: status.id,
                statusName: status.name
            });
            await broadcast(null, 'updateRequest', {channelId});

            // We do NOT clear cookies here anymore, so the user can still read the chat until they clear it
            return reply.send({success: true, ticket: updated});
        } catch (e) {
            console.error('[widget] close error:', e);
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });

    app.get('/v1/messages/widget/:channelId', async (req, reply) => {
        try {
            const {channelId} = req.params as { channelId: string };
            const cookieChannelId = req.cookies.widget_channel;

            if (!cookieChannelId || cookieChannelId !== channelId) {
                return reply.status(401).send({success: false, error: 'unauthorized'});
            }

            const {limit: limitStr, before: beforeStr} = req.query as any;
            const limit = Math.max(1, Math.min(100, limitStr ? parseInt(String(limitStr), 10) : 60));
            const before = beforeStr ? new Date(parseInt(String(beforeStr), 10)) : undefined;

            const where: any = before ? {channelId, createdAt: {lt: before}} : {channelId};

            const raw = await prisma.message.findMany({
                where,
                orderBy: {createdAt: 'desc'},
                take: limit,
            });

            const out: any[] = [];
            for (const msg of raw) {
                const contentBuffer: any = (msg as any).content as any;
                const content = Buffer.isBuffer(contentBuffer)
                    ? contentBuffer.toString('utf8')
                    : Buffer.from(new Uint8Array(Object.values(contentBuffer ?? {}))).toString('utf8');

                let author;
                if (!msg.userId) {
                    author = {
                        id: 'guest',
                        image: null,
                        name: 'Utilisateur',
                        role: null,
                    };
                } else if (msg.userId.startsWith('guest_')) {
                    author = {
                        id: msg.userId,
                        image: null,
                        name: 'Utilisateur',
                        role: null,
                    };
                } else {
                    const user = await prisma.user.findUnique({where: {id: msg.userId}});
                    author = {
                        id: msg.userId,
                        image: null, // Hide admin image from guest
                        name: 'Bénévole Écoutant',
                        role: user?.role ?? null,
                    };
                }

                out.push({
                    id: msg.id,
                    author,
                    content,
                    timestamp: new Date(msg.createdAt).getTime(),
                    channel: {id: channelId},
                    reactions: [],
                });
            }
            return out.reverse();
        } catch (e) {
            console.error('[widget] messages error:', e);
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });

    app.post('/v1/messages/widget/:channelId', async (req, reply) => {
        try {
            const {channelId} = req.params as { channelId: string };
            const cookieChannelId = req.cookies.widget_channel;
            const uid = req.cookies.widget_uid;

            if (!cookieChannelId || cookieChannelId !== channelId || !uid) {
                return reply.status(401).send({success: false, error: 'unauthorized'});
            }

            const body = (req.body ?? {}) as { content?: string };
            const content = body.content;
            if (typeof content !== 'string' || content.trim().length === 0 || content.length > 2000) {
                return reply.status(400).send({success: false, error: 'invalid_content'});
            }

            const ticket = await prisma.ticket.findFirst({
                where: {channelId}
            });

            const message = await prisma.message.create({
                data: {
                    userId: null,
                    channelId: channelId,
                    ticketId: ticket?.id,
                    content: Buffer.from(content, 'utf8'),
                    createdAt: new Date(),
                }
            });

            const messageData = {
                id: message.id,
                author: {
                    id: uid || 'guest',
                    image: null,
                    name: 'Utilisateur',
                    role: null,
                },
                content: content,
                timestamp: message.createdAt.getTime(),
                channel: {id: channelId},
                reactions: [],
            };

            await broadcast(channelId, 'message', messageData);

            return reply.send({success: true, message: messageData});
        } catch (e) {
            console.error('[widget] message error:', e);
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });
}
