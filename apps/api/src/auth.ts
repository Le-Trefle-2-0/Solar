import {createRemoteJWKSet, JWTPayload, jwtVerify} from 'jose';
import {APP_URL, INTERNAL_AUTH_URL} from './env.js';
import {prisma} from './prisma.js';

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
 * Validates authentication via JWT (Bearer) or API Key (token header).
 * Returns the userId if valid, or null otherwise.
 */
export async function authenticate(req: any): Promise<string | null> {
    // 1. Try JWT
    const jwt = await verifyAuthorizationHeader(req.headers.authorization);
    if (jwt) {
        return (jwt.sub as string) || (jwt as any).userId || null;
    }

    // 2. Try API Key (Header or Query)
    const token = (req.headers['token'] as string) || (req.query?.token as string) || '';
    if (token) {
        const key = await prisma.apikey.findFirst({where: {key: token}});
        if (key && key.enabled !== false && (!key.expiresAt || key.expiresAt > new Date())) {
            return key.userId;
        }
    }

    return null;
}
