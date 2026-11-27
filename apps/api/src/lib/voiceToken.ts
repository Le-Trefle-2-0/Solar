import {createHmac, timingSafeEqual} from 'crypto';

/**
 * Visitor access to a voice ticket's room. A token is signed by the API for one ticket channel
 * and one hour; the widget gets it through its session cookies, a Discord user through the link
 * the bot forwards. The voice service never checks it itself: it asks the API.
 */

export const VOICE_TOKEN_TTL_MS = 60 * 60 * 1000;
const CHANNEL_RE = /^[A-Za-z0-9_-]{1,64}$/;

export interface VoiceToken {
    channelId: string;
    exp: number;
    t: string;
}

export function signVoiceToken(secret: string, channelId: string, exp: number): string {
    // Domain-separated from the widget guest signatures that use the same secret
    return createHmac('sha256', secret).update(`voice.${channelId}.${exp}`).digest('hex');
}

export function issueVoiceToken(secret: string, channelId: string, now = Date.now()): VoiceToken {
    const exp = now + VOICE_TOKEN_TTL_MS;
    return {channelId, exp, t: signVoiceToken(secret, channelId, exp)};
}

export function verifyVoiceToken(secret: string, token: unknown, now = Date.now()): token is VoiceToken {
    if (!token || typeof token !== 'object') return false;
    const {channelId, t} = token as Record<string, unknown>;
    const exp = Number((token as Record<string, unknown>).exp);
    if (typeof channelId !== 'string' || !CHANNEL_RE.test(channelId)) return false;
    if (!Number.isFinite(exp) || exp <= now || exp > now + VOICE_TOKEN_TTL_MS) return false;
    if (typeof t !== 'string' || !/^[a-f0-9]{64}$/.test(t)) return false;
    return timingSafeEqual(Buffer.from(t), Buffer.from(signVoiceToken(secret, channelId, exp)));
}

/** Public page a Discord user opens to join the call (the bot forwards it). */
export function voiceLink(appUrl: string, token: VoiceToken): string {
    const q = new URLSearchParams({e: String(token.exp), t: token.t});
    return `${appUrl.replace(/\/$/, '')}/vocal/${token.channelId}?${q}`;
}
