import {createHash, timingSafeEqual} from 'crypto';

/**
 * Constant-time string comparison. Both sides are hashed first so the
 * buffers always have the same length and the secret's length does not leak.
 */
export function safeEqual(provided: string, expected: string): boolean {
    if (!expected) return false;
    const a = createHash('sha256').update(provided).digest();
    const b = createHash('sha256').update(expected).digest();
    return timingSafeEqual(a, b);
}
