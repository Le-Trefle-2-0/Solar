import {createHash, createHmac} from 'crypto';

const PREFIX = 'h1:';
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

function hmac(value: string): string {
    const secret = process.env.DISCORD_ID_HASH_SECRET;
    if (!secret) throw new Error('DISCORD_ID_HASH_SECRET is not set');
    return PREFIX + createHmac('sha256', secret).update(value).digest('hex');
}

// The HMAC is taken over the SHA-256 of the id, so that tickets closed before this change
// (which only store that SHA-256) can be converted without knowing the original id.
export function pseudonymize(discordUserID: string): string {
    return hmac(sha256(discordUserID));
}

/** Converts a legacy unkeyed hash; returns null if the value is not one. */
export function upgradeLegacyHash(stored: string): string | null {
    return /^[0-9a-f]{64}$/.test(stored) ? hmac(stored) : null;
}

/** Every form under which the requester of a ticket may be stored. */
export function requesterIdVariants(stored: string): string[] {
    if (stored.startsWith(PREFIX)) return [stored];
    const upgraded = upgradeLegacyHash(stored);
    return upgraded ? [stored, upgraded] : [stored, pseudonymize(stored), sha256(stored)];
}
