import {createRemoteJWKSet, jwtVerify, JWTPayload} from 'jose';
import {APP_URL} from './env.js';

const JWKS = createRemoteJWKSet(new URL(`${APP_URL}/api/auth/jwks`));

export async function verifyAuthorizationHeader(authHeader?: string): Promise<JWTPayload | null> {
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    try {
        const {payload} = await jwtVerify(token, JWKS, {
            issuer: APP_URL,
            audience: APP_URL,
        });
        return payload;
    } catch {
        return null;
    }
}
