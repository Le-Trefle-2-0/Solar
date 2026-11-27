import {createHash, createHmac, randomBytes, timingSafeEqual} from 'crypto';

/** Leading zero bits the solution hash must have: about 32 000 attempts on average. */
export const POW_DIFFICULTY = 15;
const TTL_MS = 5 * 60 * 1000;

/** Solved challenges, kept until they expire so each one works once (per API instance). */
const used = new Map<string, number>();

function sign(salt: string, exp: number): string {
    const secret = process.env.WS_GUEST_SECRET;
    if (!secret) throw new Error('WS_GUEST_SECRET is not set');
    // A derived key, so a challenge signature can never pass for a widget session signature.
    const key = createHmac('sha256', secret).update('proof-of-work').digest();
    return createHmac('sha256', key).update(`${salt}.${exp}`).digest('hex');
}

export function createChallenge(now = Date.now()) {
    const salt = randomBytes(16).toString('hex');
    const exp = now + TTL_MS;
    return {salt, exp, difficulty: POW_DIFFICULTY, sig: sign(salt, exp)};
}

export function hasLeadingZeroBits(hash: Buffer, bits: number): boolean {
    for (let i = 0; i < bits; i++) {
        if (hash[i >> 3] & (0x80 >> (i % 8))) return false;
    }
    return true;
}

/** Checks a solved challenge and consumes it. */
export function verifyPow(solution: unknown, now = Date.now()): boolean {
    const {salt, exp, sig, nonce} = (solution ?? {}) as Record<string, unknown>;
    if (typeof salt !== 'string' || typeof exp !== 'number' || typeof sig !== 'string' || typeof nonce !== 'number') {
        return false;
    }
    if (exp <= now || used.has(salt)) return false;

    const expected = Buffer.from(sign(salt, exp));
    const received = Buffer.from(sig);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;
    if (!hasLeadingZeroBits(createHash('sha256').update(`${salt}.${nonce}`).digest(), POW_DIFFICULTY)) return false;

    for (const [key, expiry] of used) if (expiry <= now) used.delete(key);
    used.set(salt, exp);
    return true;
}
