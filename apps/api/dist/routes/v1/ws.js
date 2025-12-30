import crypto, { createHmac } from 'crypto';
export async function registerWsRoutes(app) {
    app.post('/v1/ws/guest', async (req, reply) => {
        try {
            const secret = process.env.WS_GUEST_SECRET || 'fallback_secret_for_dev_only';
            if (!secret)
                return reply.send({ success: false, error: 'missing_secret' });
            const body = (req.body ?? {});
            const channelId = String(body.channelId || '');
            let uid = String(body.uid || '');
            if (!channelId)
                return reply.send({ success: false, error: 'invalid_channel' });
            if (!uid)
                uid = `guest_${crypto.randomUUID()}`;
            const exp = Date.now() + 24 * 60 * 60 * 1000;
            const base = `${channelId}.${uid}.${exp}`;
            const sig = createHmac('sha256', secret).update(base).digest('hex');
            return reply.send({
                success: true,
                credentials: { channelId, uid, exp, sig }
            });
        }
        catch (e) {
            return reply.send({ success: false, error: 'internal_error' });
        }
    });
}
