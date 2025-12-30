import { prisma } from '../../prisma.js';
import crypto, { createHmac } from 'crypto';
import { broadcast } from '../../lib/broadcast.js';
const WIDGET_COOKIES = ['widget_channel', 'widget_uid', 'widget_exp', 'widget_sig', 'widget_public'];
function setWidgetCookie(reply, name, value, maxAgeSec = 60 * 60 * 24) {
    reply.setCookie(name, value, {
        path: '/',
        maxAge: maxAgeSec,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false, // Must be readable by client for WS auth
    });
}
function clearWidgetCookies(reply) {
    WIDGET_COOKIES.forEach(name => {
        reply.setCookie(name, '', {
            path: '/',
            maxAge: 0,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });
    });
}
export async function registerWidgetRoutes(app) {
    app.post('/v1/widget/session', async (req, reply) => {
        try {
            const visitorName = "utilisateur";
            const secret = process.env.WS_GUEST_SECRET || 'fallback_secret_for_dev_only';
            let channelId = req.cookies.widget_channel || '';
            let uid = req.cookies.widget_uid || '';
            let expStr = req.cookies.widget_exp || '';
            let sig = req.cookies.widget_sig || '';
            if (channelId) {
                const ticket = await prisma.ticket.findUnique({ where: { channelId } });
                if (!ticket || ticket.statusName === 'closed' || ticket.statusName === 'commented') {
                    clearWidgetCookies(reply);
                    return reply.send({ success: false, error: 'session_expired' });
                }
            }
            if (!channelId) {
                const syntheticId = `web:${crypto.randomUUID()}`;
                const ua = req.headers['user-agent'] || 'unknown';
                const status = await prisma.ticketStatus.findUnique({ where: { name: 'waiting' } });
                if (!status)
                    return reply.status(500).send({ success: false, error: 'status_missing' });
                const ticket = await prisma.ticket.create({
                    data: {
                        discordUserID: syntheticId,
                        source: 'web',
                        metadata: { userAgent: ua, visitorName },
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        statusName: status.name,
                        statusLabel: status.label,
                    },
                });
                let channelName = String(ticket.id).padStart(5, '0');
                channelName = 'Ticket-' + channelName;
                const channel = await prisma.channel.create({ data: { name: channelName } });
                const updatedTicket = await prisma.ticket.update({
                    where: { id: ticket.id },
                    data: {
                        updatedAt: new Date(),
                        channelName: channel.name,
                        channelId: channel.id,
                    },
                });
                channelId = updatedTicket.channelId;
                await broadcast(null, 'updateRequest', { channelId });
            }
            const now = Date.now();
            let exp = Number(expStr) || now + 24 * 60 * 60 * 1000;
            if (!uid)
                uid = `guest_${crypto.randomUUID()}`;
            if (exp <= now)
                exp = now + 24 * 60 * 60 * 1000;
            const authBase = `${channelId}.${uid}.${exp}`;
            const expectedSig = createHmac('sha256', secret).update(authBase).digest('hex');
            if (sig !== expectedSig)
                sig = expectedSig;
            setWidgetCookie(reply, 'widget_channel', channelId);
            setWidgetCookie(reply, 'widget_uid', uid);
            setWidgetCookie(reply, 'widget_exp', String(exp));
            setWidgetCookie(reply, 'widget_sig', sig);
            setWidgetCookie(reply, 'widget_public', '1');
            return reply.send({
                success: true,
                channelId,
                credentials: { channelId, uid, exp, sig }
            });
        }
        catch (e) {
            console.error('[widget] session error:', e);
            return reply.status(500).send({ success: false, error: 'internal_error' });
        }
    });
    app.post('/v1/widget/close', async (req, reply) => {
        try {
            const channelId = req.cookies.widget_channel;
            if (!channelId)
                return reply.status(401).send({ success: false, error: 'no_active_session' });
            const ticket = await prisma.ticket.findUnique({ where: { channelId } });
            if (!ticket)
                return reply.status(404).send({ success: false, error: 'ticket_not_found' });
            if (ticket.statusName === 'closed' || ticket.statusName === 'commented') {
                clearWidgetCookies(reply);
                return reply.send({ success: true, status: ticket.statusName });
            }
            // Perform closure logic
            const status = await prisma.ticketStatus.findUnique({ where: { name: 'closed' } });
            if (!status)
                return reply.status(500).send({ success: false, error: 'status_missing' });
            const originalDiscordUserID = ticket.discordUserID;
            const updated = await prisma.ticket.update({
                where: { id: ticket.id },
                include: { status: true },
                data: {
                    statusName: status.name,
                    statusLabel: status.label,
                    discordUserID: crypto.createHash('sha256').update(ticket.discordUserID).digest('hex'),
                },
            });
            // Broadcast status update
            await broadcast(channelId, 'ticketStatusUpdate', {
                channelId,
                statusId: status.id,
                statusName: status.name
            });
            await broadcast(null, 'updateRequest', { channelId });
            clearWidgetCookies(reply);
            return reply.send({ success: true, ticket: updated });
        }
        catch (e) {
            console.error('[widget] close error:', e);
            return reply.status(500).send({ success: false, error: 'internal_error' });
        }
    });
}
