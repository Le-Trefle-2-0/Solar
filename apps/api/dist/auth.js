import { createRemoteJWKSet, jwtVerify } from 'jose';
import { APP_URL } from './env.js';
import { prisma } from './prisma.js';
const JWKS = createRemoteJWKSet(new URL(`${APP_URL}/api/auth/jwks`));
export async function verifyAuthorizationHeader(authHeader) {
    if (!authHeader)
        return null;
    const token = authHeader.replace('Bearer ', '');
    try {
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: APP_URL,
            audience: APP_URL,
        });
        return payload;
    }
    catch {
        return null;
    }
}
/**
 * Validates authentication via JWT (Bearer) or API Key (token header).
 * Returns the userId if valid, or null otherwise.
 */
export async function authenticate(req) {
    // 1. Try JWT
    const jwt = await verifyAuthorizationHeader(req.headers.authorization);
    if (jwt) {
        return jwt.sub || jwt.userId || null;
    }
    // 2. Try API Key (Header or Query)
    const token = req.headers['token'] || req.query?.token || '';
    if (token) {
        const key = await prisma.apikey.findFirst({ where: { key: token } });
        if (key && key.enabled !== false && (!key.expiresAt || key.expiresAt > new Date())) {
            return key.userId;
        }
    }
    return null;
}
