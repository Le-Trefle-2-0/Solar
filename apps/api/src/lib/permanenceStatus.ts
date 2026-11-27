import {prisma} from '../prisma.js';

/**
 * Whether the listening service is open: new écoutes can only be opened from the website while
 * a permanence (planning event) is running. Écoutes already open can always be continued.
 */

export type PermanenceWindow = {start: Date; end: Date};
export type PermanenceStatus =
    | {open: true; closesAt: string}
    | {open: false; nextOpening: {start: string; end: string} | null};

export function computePermanenceStatus(events: PermanenceWindow[], now: Date): PermanenceStatus {
    const t = now.getTime();
    const running = events
        .filter(e => e.start.getTime() <= t && e.end.getTime() > t)
        .sort((a, b) => b.end.getTime() - a.end.getTime())[0];
    if (running) return {open: true, closesAt: running.end.toISOString()};
    const next = events
        .filter(e => e.start.getTime() > t)
        .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
    return {open: false, nextOpening: next ? {start: next.start.toISOString(), end: next.end.toISOString()} : null};
}

export async function getPermanenceStatus(now = new Date()): Promise<PermanenceStatus> {
    const events = await prisma.event.findMany({
        where: {end: {gt: now}},
        orderBy: {start: 'asc'},
        take: 20,
        select: {start: true, end: true},
    });
    return computePermanenceStatus(events, now);
}
