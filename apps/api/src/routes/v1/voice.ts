import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {broadcast} from '../../lib/broadcast.js';
import {getUserPermissions, hasPermission} from '../../lib/permissions.js';
import {getChannelAccess} from '../../lib/channelAccess.js';
import {verifyWidgetSession} from '../../lib/widgetSession.js';
import {limitPerMinute} from '../../lib/rateLimit.js';
import {issueVoiceToken, verifyVoiceToken, type VoiceToken, voiceLink} from '../../lib/voiceToken.js';
import {APP_URL} from '../../env.js';
import {endVoiceCall} from '../../lib/voiceControl.js';

/**
 * Voice tickets. A ticket is text by default; the volunteer handling it can switch it to voice.
 * The visitor then gets a way in: a button in the widget (website), or a link the Discord bot
 * forwards (Discord). The call itself runs on the voice service, which asks
 * /v1/internal/voice/authorize who may join.
 */

type VoiceTicket = {id: number; channelId: string | null; statusName: string; voice: boolean; source: string | null; discordUserID: string; assignedUserId: string | null};

export interface VoiceRouteDeps {
    authenticate: (req: any) => Promise<string | null | undefined>;
    getPermissions: (userId: string) => Promise<string[]>;
    canWrite: (userId: string, channelId: string) => Promise<boolean>;
    findTicket: (channelId: string) => Promise<VoiceTicket | null>;
    setVoice: (ticketId: number) => Promise<void>;
    /** Back to text, call closed for both sides, widget told. */
    endVoice: (channelId: string) => Promise<void>;
    readWidgetSession: (cookies: Record<string, string | undefined>) => {channelId: string} | null;
    notify: (channelId: string, event: string, data: unknown, audience?: 'bots') => Promise<void>;
    secret: () => string;
    appUrl: string;
    now: () => number;
    /** State of every room, from the voice service. */
    fetchRooms: () => Promise<VoiceRoomState[]>;
    findAssignedChannelIds: (userId: string) => Promise<string[]>;
}

export type VoiceRoomState =
    | {type: 'permanence'; channelId: string; participants: {peerId: string; name: string; muted: boolean}[]}
    | {type: 'ticket'; channelId: string; volunteer: boolean; visitor: boolean};

const defaultDeps: VoiceRouteDeps = {
    authenticate,
    getPermissions: getUserPermissions,
    canWrite: async (userId, channelId) => (await getChannelAccess(userId, channelId)).write,
    findTicket: (channelId) => prisma.ticket.findUnique({
        where: {channelId},
        select: {id: true, channelId: true, statusName: true, voice: true, source: true, discordUserID: true, assignedUserId: true},
    }),
    setVoice: async (ticketId) => {
        await prisma.ticket.update({where: {id: ticketId}, data: {voice: true, updatedAt: new Date()}});
    },
    endVoice: endVoiceCall,
    readWidgetSession: (cookies) => verifyWidgetSession(cookies),
    notify: async (channelId, event, data, audience) => {
        await broadcast(audience ? null : channelId, event, data, audience ? {audience} : {});
    },
    secret: () => process.env.WS_GUEST_SECRET!,
    appUrl: APP_URL,
    now: () => Date.now(),
    fetchRooms: async () => {
        const base = (process.env.VOICE_INTERNAL_URL || 'http://localhost:3003').replace(/\/$/, '');
        const res = await fetch(`${base}/internal/status`, {
            headers: {Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`},
            signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) throw new Error(`voice status ${res.status}`);
        return ((await res.json()) as {rooms: VoiceRoomState[]}).rooms;
    },
    findAssignedChannelIds: async (userId) => (await prisma.ticket.findMany({
        where: {assignedUserId: userId, channelId: {not: null}},
        select: {channelId: true},
    })).map(t => t.channelId!),
};

const CHANNEL_RE = /^[A-Za-z0-9_-]{1,64}$/;
export const isFromDiscord = (ticket: Pick<VoiceTicket, 'source' | 'discordUserID'>) =>
    ticket.source !== 'web' && !ticket.discordUserID.startsWith('web:');

export async function registerVoiceRoutes(app: FastifyInstance, deps: VoiceRouteDeps = defaultDeps) {
    // Volunteer: switch a ticket in progress to voice. Only the volunteer side can do it.
    app.post('/v1/voice/tickets', limitPerMinute(20), async (req, reply) => {
        const userId = await deps.authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');
        const channelId = (req.body as {channelId?: unknown} | undefined)?.channelId;
        if (typeof channelId !== 'string' || !CHANNEL_RE.test(channelId)) return reply.status(400).send({error: 'invalid_channel'});
        if (!hasPermission(await deps.getPermissions(userId), 'tickets.launch_voice')) return reply.status(403).send('forbidden');
        if (!(await deps.canWrite(userId, channelId))) return reply.status(403).send('forbidden');

        const ticket = await deps.findTicket(channelId);
        if (!ticket) return reply.status(404).send({error: 'ticket_not_found'});
        if (ticket.statusName !== 'started') return reply.status(409).send({error: 'ticket_not_in_progress'});

        if (!ticket.voice) await deps.setVoice(ticket.id);
        // Widget (in the ticket's room) and volunteers following the ticket
        await deps.notify(channelId, 'ticketVoice', {channelId, voice: true});

        // Discord user: the bot sends them the public link
        let link: string | null = null;
        if (isFromDiscord(ticket)) {
            const token = issueVoiceToken(deps.secret(), channelId, deps.now());
            link = voiceLink(deps.appUrl, token);
            await deps.notify(channelId, 'voiceInvite', {
                channelId,
                discordUserID: ticket.discordUserID,
                url: link,
                expiresAt: token.exp,
            }, 'bots');
        }
        return reply.send({success: true, voice: true, source: isFromDiscord(ticket) ? 'discord' : 'web', link});
    });

    // Volunteer: end the call (the écoute goes on in text). Same rights as starting it.
    app.post('/v1/voice/tickets/end', limitPerMinute(20), async (req, reply) => {
        const userId = await deps.authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');
        const channelId = (req.body as {channelId?: unknown} | undefined)?.channelId;
        if (typeof channelId !== 'string' || !CHANNEL_RE.test(channelId)) return reply.status(400).send({error: 'invalid_channel'});
        if (!hasPermission(await deps.getPermissions(userId), 'tickets.launch_voice')) return reply.status(403).send('forbidden');
        if (!(await deps.canWrite(userId, channelId))) return reply.status(403).send('forbidden');
        const ticket = await deps.findTicket(channelId);
        if (!ticket) return reply.status(404).send({error: 'ticket_not_found'});
        await deps.endVoice(channelId);
        return reply.send({success: true, voice: false});
    });

    // Widget visitor: a voice token for their own ticket, once it is a voice ticket
    app.post('/v1/widget/voice', limitPerMinute(30), async (req, reply) => {
        const session = deps.readWidgetSession(req.cookies ?? {});
        if (!session) return reply.status(401).send({success: false, error: 'no_active_session'});
        const ticket = await deps.findTicket(session.channelId);
        if (!ticket || !ticket.voice || ticket.statusName !== 'started') {
            return reply.status(409).send({success: false, error: 'voice_unavailable'});
        }
        return reply.send({success: true, token: issueVoiceToken(deps.secret(), session.channelId, deps.now())});
    });

    // Who is in which voice room: permanence rooms for every member; the state of ticket calls
    // for supervisors (tickets.read_all) and for the volunteer assigned to the ticket.
    app.get('/v1/voice/status', async (req, reply) => {
        const userId = await deps.authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');
        let rooms: VoiceRoomState[];
        try {
            rooms = await deps.fetchRooms();
        } catch {
            return reply.send({available: false, rooms: []});
        }
        const readAll = hasPermission(await deps.getPermissions(userId), 'tickets.read_all');
        const assigned = readAll ? null : new Set(await deps.findAssignedChannelIds(userId));
        return reply.send({
            available: true,
            rooms: rooms.filter(r => r.type === 'permanence' || readAll || assigned!.has(r.channelId)),
        });
    });

    // Public voice page (Discord users): is this link genuine, and is the call still possible?
    app.get('/v1/voice/link', limitPerMinute(30), async (req, reply) => {
        const q = req.query as {c?: string; e?: string; t?: string};
        const token = {channelId: q.c, exp: Number(q.e), t: q.t};
        if (!verifyVoiceToken(deps.secret(), token, deps.now())) return reply.send({valid: false});
        const ticket = await deps.findTicket(token.channelId);
        const open = !!ticket && ticket.voice && ticket.statusName === 'started';
        return reply.send({valid: open, ended: !!ticket && !open, token: open ? token as VoiceToken : undefined});
    });
}
