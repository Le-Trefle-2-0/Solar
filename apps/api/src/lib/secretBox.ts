import {createCipheriv, createDecipheriv, hkdfSync, randomBytes} from 'crypto';

/**
 * Encryption of secrets stored in the database (the Discord bot token): AES-256-GCM with a key
 * derived from INTERNAL_API_SECRET. A database dump alone does not reveal them; changing
 * INTERNAL_API_SECRET makes them unreadable (the bot then has to be set up again).
 */

const VERSION = 'v1';

function keyFor(purpose: string, secret = process.env.INTERNAL_API_SECRET): Buffer {
    if (!secret) throw new Error('INTERNAL_API_SECRET is not set');
    return Buffer.from(hkdfSync('sha256', secret, 'solar', `secret-box:${purpose}`, 32));
}

export function seal(plain: string, purpose: string, secret?: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', keyFor(purpose, secret), iv);
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return [VERSION, iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':');
}

/** Null when the value cannot be read (other key, altered value). */
export function open(sealed: string, purpose: string, secret?: string): string | null {
    try {
        const [version, iv, tag, data] = sealed.split(':');
        if (version !== VERSION || !iv || !tag || !data) return null;
        const decipher = createDecipheriv('aes-256-gcm', keyFor(purpose, secret), Buffer.from(iv, 'base64'));
        decipher.setAuthTag(Buffer.from(tag, 'base64'));
        return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
    } catch {
        return null;
    }
}
