import {credentialsFromEnv, type Credentials} from './config.js';

/**
 * Where the bot's credentials come from: Solar's set-up first (GET /v1/internal/bot/credentials,
 * with INTERNAL_API_SECRET, already in the .env of every service), else the .env of an older
 * set-up.
 */

export type CredentialsLookup =
    | {status: 'ok'; credentials: Credentials; source: 'solar' | 'env'}
    | {status: 'not_configured'; missing: string[]}
    | {status: 'unreachable'; reason: string};

export async function lookUpCredentials(
    apiBaseUrl: string,
    env: NodeJS.ProcessEnv = process.env,
    fetchImpl: typeof fetch = fetch,
): Promise<CredentialsLookup> {
    const fromEnv = credentialsFromEnv(env);
    const fallback = (other: CredentialsLookup): CredentialsLookup =>
        fromEnv ? {status: 'ok', credentials: fromEnv, source: 'env'} : other;

    const secret = env.INTERNAL_API_SECRET;
    if (!secret) return fallback({status: 'not_configured', missing: ['INTERNAL_API_SECRET']});
    try {
        const res = await fetchImpl(`${apiBaseUrl}/v1/internal/bot/credentials`, {
            headers: {Authorization: `Bearer ${secret}`},
            signal: AbortSignal.timeout(10_000),
        });
        const data = await res.json().catch(() => null) as any;
        if (res.status === 404 && data?.error === 'not_configured') {
            return fallback({status: 'not_configured', missing: Array.isArray(data.missing) ? data.missing : []});
        }
        if (!res.ok) return fallback({status: 'unreachable', reason: `the API answered ${res.status}`});
        const {discordToken, guildId, solarApiKey} = data ?? {};
        if (typeof discordToken !== 'string' || typeof guildId !== 'string' || typeof solarApiKey !== 'string') {
            return fallback({status: 'unreachable', reason: 'unexpected answer'});
        }
        return {status: 'ok', credentials: {discordToken, guildId, solarApiKey}, source: 'solar'};
    } catch (e) {
        return fallback({status: 'unreachable', reason: (e as Error).message});
    }
}

/** Same credentials: nothing to restart. */
export const sameCredentials = (a: Credentials | null, b: Credentials | null) =>
    !!a && !!b && a.discordToken === b.discordToken && a.guildId === b.guildId && a.solarApiKey === b.solarApiKey;
