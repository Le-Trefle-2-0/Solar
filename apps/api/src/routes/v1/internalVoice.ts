import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {isInternal} from '../../lib/internalAuth.js';
import {getActor} from '../../lib/permissions.js';
import {hasPermission} from '../../lib/roleAssignment.js';
import {getChannelAccess, isPermanenceChannel} from '../../lib/channelAccess.js';
import {verifyVoiceToken} from '../../lib/voiceToken.js';

/**
 * Who may join a voice room (asked by the voice service, Bearer INTERNAL_API_SECRET):
 * - permanence room: every signed-in member, like the permanence's text channel;
 * - ticket room (one to one): the volunteer handling the ticket (tickets.launch_voice and
 *   write access) and the visitor holding a voice token for it, only while the ticket is a
 *   voice ticket in progress. Supervisors see the call's state, they do not join it.
 */

export type VoiceRoom = {type: 'permanence' | 'ticket'; channelId: string};
export type VoiceGrant = {allowed: true; role: 'volunteer' | 'visitor'; userId: string | null; name: string} | {allowed: false; reason: string};

export interface InternalVoiceDeps {
    isInternal: (req: any) => boolean;
    findUser: (userId: string) => Promise<{id: string; name: string; displayUsername: string | null; banned: boolean | null} | null>;
    getPermissions: (userId: string) => Promise<string[] | null>;
    canWrite: (userId: string, channelId: string) => Promise<boolean>;
    isPermanenceChannel: (channelId: string) => Promise<boolean>;
    findTicket: (channelId: string) => Promise<{voice: boolean; statusName: string} | null>;
    secret: () => string;
    now: () => number;
}

const defaultDeps: InternalVoiceDeps = {
    isInternal,
    findUser: (userId) => prisma.user.findUnique({
        where: {id: userId},
        select: {id: true, name: true, displayUsername: true, banned: true},
    }),
    getPermissions: async (userId) => (await getActor(userId))?.permissions ?? null,
    canWrite: async (userId, channelId) => (await getChannelAccess(userId, channelId)).write,
    isPermanenceChannel,
    findTicket: (channelId) => prisma.ticket.findUnique({where: {channelId}, select: {voice: true, statusName: true}}),
    secret: () => process.env.WS_GUEST_SECRET!,
    now: () => Date.now(),
};

const CHANNEL_RE = /^[A-Za-z0-9_-]{1,64}$/;

export async function authorizeVoice(deps: InternalVoiceDeps, body: unknown): Promise<VoiceGrant> {
    const b = (body ?? {}) as {room?: {type?: unknown; channelId?: unknown}; userId?: unknown; token?: unknown};
    const type = b.room?.type;
    const channelId = b.room?.channelId;
    if ((type !== 'permanence' && type !== 'ticket') || typeof channelId !== 'string' || !CHANNEL_RE.test(channelId)) {
        return {allowed: false, reason: 'invalid_room'};
    }

    // Signed-in volunteer
    if (typeof b.userId === 'string' && b.userId && b.userId.length <= 128) {
        const user = await deps.findUser(b.userId);
        if (!user || user.banned) return {allowed: false, reason: 'unknown_user'};
        const name = user.displayUsername || user.name;

        if (type === 'permanence') {
            if (!(await deps.isPermanenceChannel(channelId))) return {allowed: false, reason: 'not_a_permanence'};
            return {allowed: true, role: 'volunteer', userId: user.id, name};
        }

        const ticket = await deps.findTicket(channelId);
        if (!ticket?.voice || ticket.statusName !== 'started') return {allowed: false, reason: 'no_voice_call'};
        const perms = await deps.getPermissions(user.id);
        if (!perms || !hasPermission(perms, 'tickets.launch_voice')) return {allowed: false, reason: 'forbidden'};
        if (!(await deps.canWrite(user.id, channelId))) return {allowed: false, reason: 'forbidden'};
        return {allowed: true, role: 'volunteer', userId: user.id, name};
    }

    // Visitor with a voice token: ticket rooms only
    if (b.token !== undefined) {
        if (type !== 'ticket') return {allowed: false, reason: 'forbidden'};
        if (!verifyVoiceToken(deps.secret(), b.token, deps.now()) || (b.token as {channelId: string}).channelId !== channelId) {
            return {allowed: false, reason: 'invalid_token'};
        }
        const ticket = await deps.findTicket(channelId);
        if (!ticket?.voice || ticket.statusName !== 'started') return {allowed: false, reason: 'no_voice_call'};
        return {allowed: true, role: 'visitor', userId: null, name: 'Visiteur'};
    }

    return {allowed: false, reason: 'no_identity'};
}

export async function registerInternalVoiceRoutes(app: FastifyInstance, deps: InternalVoiceDeps = defaultDeps) {
    app.post('/v1/internal/voice/authorize', async (req, reply) => {
        if (!deps.isInternal(req)) return reply.status(401).send({error: 'unauthorized'});
        return reply.send(await authorizeVoice(deps, req.body));
    });
}
