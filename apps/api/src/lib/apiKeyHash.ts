import {createHash} from 'crypto';

/**
 * API keys are stored hashed (#278): a database dump does not give working keys. SHA-256 in
 * base64url, Better Auth's own format, so keys made by its api-key plugin are checked the same way.
 * The bot's current key is also kept encrypted (discordBotCredentials.ts) for the bot to fetch it.
 */
export const hashApiKey = (key: string) => createHash('sha256').update(key).digest('base64url');
