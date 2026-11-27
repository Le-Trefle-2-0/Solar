import {prisma} from '../prisma.js';

/**
 * A JWT is signed for 15 minutes and carries the id of the Better Auth session it came from
 * (`sid`). The session must still exist: signing out, resetting the password or revoking
 * sessions ends the API, WebSocket and voice access at once, not when the JWT expires (#276).
 */
export function readSessionId(payload: unknown): string | null {
    const sid = (payload as {sid?: unknown} | null)?.sid;
    return typeof sid === 'string' && sid.length > 0 && sid.length <= 128 ? sid : null;
}

export async function isSessionActive(sid: unknown, userId: string): Promise<boolean> {
    if (typeof sid !== 'string' || !sid || sid.length > 128) return false;
    const session = await prisma.session.findFirst({
        where: {id: sid, userId, expiresAt: {gt: new Date()}},
        select: {id: true},
    });
    return !!session;
}
