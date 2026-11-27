import {createRemoteJWKSet, JWTPayload, jwtVerify} from 'jose';
import {APP_URL, INTERNAL_AUTH_URL} from './env.js';
import {prisma} from './prisma.js';
import {getActor} from './lib/permissions.js';

const JWKS = createRemoteJWKSet(new URL(`${INTERNAL_AUTH_URL}/api/auth/jwks`));
const normalizeUrl = (value: string) => value.replace(/\/$/, '');
const issuerCandidates = Array.from(
    new Set([APP_URL, INTERNAL_AUTH_URL].filter(Boolean).map(normalizeUrl))
);
const jwtIssuer = issuerCandidates.length === 1 ? issuerCandidates[0] : issuerCandidates;
const jwtAudience = jwtIssuer;

export async function verifyAuthorizationHeader(authHeader?: string): Promise<JWTPayload | null> {
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    try {
        const {payload} = await jwtVerify(token, JWKS, {
            issuer: jwtIssuer,
            audience: jwtAudience,
        });
        return payload;
    } catch (e: any) {
        console.warn('[auth] JWT verification failed:', e.message);
        return null;
    }
}

/**
 * The account still exists, is not banned and may act (see getActor): a JWT stays valid for a
 * while after a ban or a removal, so the account is checked on every request (#247, #249).
 */
async function activeAccount(userId: string | null | undefined): Promise<string | null> {
    if (!userId) return null;
    return (await getActor(userId)) ? userId : null;
}

/**
 * Validates authentication via JWT (Bearer) or API Key (token header).
 * Returns the userId if valid and the account active, or null otherwise.
 */
export async function authenticate(req: any): Promise<string | null> {
    // 1. Try JWT
    const jwt = await verifyAuthorizationHeader(req.headers.authorization);
    if (jwt) {
        return activeAccount((jwt.sub as string) || (jwt as any).userId);
    }

    // 2. Try API Key (header only: query strings end up in logs and browser history)
    const token = (req.headers['token'] as string) || '';
    if (token) {
        const key = await prisma.apikey.findFirst({where: {key: token}});
        if (key && key.enabled !== false && (!key.expiresAt || key.expiresAt > new Date())) {
            return activeAccount(key.userId);
        }
    }

    return null;
}
