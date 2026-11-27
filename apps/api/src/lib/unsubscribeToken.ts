import {createHmac, timingSafeEqual} from 'crypto';

/**
 * Signature of newsletter unsubscribe links (#264, #223): only the recipient of a newsletter can
 * unsubscribe, with the link it carries. Same code in apps/api/src/lib/unsubscribeToken.ts and
 * apps/web/lib/security/unsubscribeToken.ts (the tests share one expected value).
 */
export function unsubscribeSignature(id: string, secret = process.env.INTERNAL_API_SECRET || ''): string {
    if (!secret) throw new Error('INTERNAL_API_SECRET is required to sign unsubscribe links');
    return createHmac('sha256', secret).update(`newsletter-unsubscribe:${id}`).digest('base64url');
}

export function isValidUnsubscribe(id: unknown, signature: unknown, secret = process.env.INTERNAL_API_SECRET || ''): boolean {
    if (typeof id !== 'string' || typeof signature !== 'string' || !id || id.length > 64 || !secret) return false;
    const expected = Buffer.from(unsubscribeSignature(id, secret));
    const given = Buffer.from(signature);
    return expected.length === given.length && timingSafeEqual(expected, given);
}
