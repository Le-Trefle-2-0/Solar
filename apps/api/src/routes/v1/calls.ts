import type {FastifyInstance} from 'fastify';
import {createHmac, randomBytes} from 'crypto';
import {authenticate} from '../../auth.js';
import {getUserPermissions, hasPermission} from '../../lib/permissions.js';
import {getChannelAccess} from '../../lib/channelAccess.js';
import {limitPerMinute} from '../../lib/rateLimit.js';
import {APP_URL} from '../../env.js';

/**
 * Voice calls (#241). A volunteer opens a call for one ticket channel and gets an unguessable
 * call id and a short-lived token signed by the API. The visitor link carries both; the
 * visitor page checks it before turning the microphone on, and the volunteer's page only
 * answers a call presenting that token, after an explicit "Accepter".
 */

export const CALL_TTL_MS = 30 * 60 * 1000;
const CALL_ID_RE = /^call-[a-f0-9]{32}$/;
const CHANNEL_RE = /^[A-Za-z0-9_-]{1,64}$/;

export function signCall(secret: string, callId: string, channelId: string, exp: number) {
    // Domain-separated from the widget guest signatures that use the same secret
    return createHmac('sha256', secret).update(`call.${callId}.${channelId}.${exp}`).digest('hex');
}

export function verifyCall(secret: string, q: {callId?: unknown; channelId?: unknown; exp?: unknown; t?: unknown}, now = Date.now()) {
    const {callId, channelId, t} = q;
    const exp = Number(q.exp);
    if (typeof callId !== 'string' || !CALL_ID_RE.test(callId)) return false;
    if (typeof channelId !== 'string' || !CHANNEL_RE.test(channelId)) return false;
    if (!Number.isFinite(exp) || exp <= now || exp > now + CALL_TTL_MS) return false;
    if (typeof t !== 'string' || !/^[a-f0-9]{64}$/.test(t)) return false;
    const expected = signCall(secret, callId, channelId, exp);
    // Fixed-length hex strings: a plain comparison of equal lengths
    let diff = 0;
    for (let i = 0; i < 64; i++) diff |= expected.charCodeAt(i) ^ t.charCodeAt(i);
    return diff === 0;
}

export interface CallsRouteDeps {
    authenticate: (req: any) => Promise<string | null | undefined>;
    getPermissions: (userId: string) => Promise<string[]>;
    canWrite: (userId: string, channelId: string) => Promise<boolean>;
    secret: () => string;
    now: () => number;
}

const defaultDeps: CallsRouteDeps = {
    authenticate,
    getPermissions: getUserPermissions,
    canWrite: async (userId, channelId) => (await getChannelAccess(userId, channelId)).write,
    secret: () => process.env.WS_GUEST_SECRET!,
    now: () => Date.now(),
};

export async function registerCallsRoutes(app: FastifyInstance, deps: CallsRouteDeps = defaultDeps) {
    // Volunteer: open a call for a ticket channel they may write in
    app.post('/v1/calls', limitPerMinute(20), async (req, reply) => {
        const userId = await deps.authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');
        const channelId = (req.body as {channelId?: unknown} | undefined)?.channelId;
        if (typeof channelId !== 'string' || !CHANNEL_RE.test(channelId)) return reply.status(400).send({error: 'invalid_channel'});
        if (!hasPermission(await deps.getPermissions(userId), 'tickets.launch_voice')) return reply.status(403).send('forbidden');
        if (!(await deps.canWrite(userId, channelId))) return reply.status(403).send('forbidden');

        const callId = `call-${randomBytes(16).toString('hex')}`;
        const exp = deps.now() + CALL_TTL_MS;
        const token = signCall(deps.secret(), callId, channelId, exp);
        const query = new URLSearchParams({c: channelId, e: String(exp), t: token});
        return reply.send({callId, channelId, exp, token, url: `${APP_URL}/webrtc/${callId}?${query}`});
    });

    // Visitor page: is this link genuine and still valid? (no account needed)
    app.get('/v1/calls/verify', limitPerMinute(30), async (req, reply) => {
        const q = req.query as {callId?: string; c?: string; e?: string; t?: string};
        const valid = verifyCall(deps.secret(), {callId: q.callId, channelId: q.c, exp: q.e, t: q.t}, deps.now());
        return reply.send({valid});
    });
}
