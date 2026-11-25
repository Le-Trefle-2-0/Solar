import {createHmac, timingSafeEqual} from 'crypto';

/** Visitor identity proven by the signed widget cookies. */
export interface WidgetSession {
    channelId: string;
    uid: string;
    exp: number;
    sig: string;
}

// No fallback: with a secret known from the source code, anyone could sign a session.
function getSecret(): string | undefined {
    return process.env.WS_GUEST_SECRET || undefined;
}

export function signWidgetSession(channelId: string, uid: string, exp: number): string {
    const secret = getSecret();
    if (!secret) throw new Error('WS_GUEST_SECRET is not set');
    return createHmac('sha256', secret).update(`${channelId}.${uid}.${exp}`).digest('hex');
}

/** Returns the session only if all cookies are present, unexpired and correctly signed. */
export function verifyWidgetSession(cookies: Record<string, string | undefined>): WidgetSession | null {
    const {widget_channel: channelId, widget_uid: uid, widget_exp: expStr, widget_sig: sig} = cookies;
    if (!channelId || !uid || !expStr || !sig || !getSecret()) return null;

    const exp = Number(expStr);
    if (!Number.isFinite(exp) || exp <= Date.now()) return null;

    const expected = Buffer.from(signWidgetSession(channelId, uid, exp));
    const received = Buffer.from(sig);
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

    return {channelId, uid, exp, sig};
}
