import {timingSafeEqual} from 'crypto';
import type {FastifyRequest} from 'fastify';

/** Service-to-service authentication: Authorization: Bearer <INTERNAL_API_SECRET> */
export function isInternal(req: FastifyRequest): boolean {
    const secret = process.env.INTERNAL_API_SECRET;
    if (!secret) return false;
    const expected = Buffer.from(`Bearer ${secret}`);
    const received = Buffer.from(req.headers.authorization ?? '');
    return received.length === expected.length && timingSafeEqual(received, expected);
}
