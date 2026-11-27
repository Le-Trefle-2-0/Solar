/**
 * Rows the app cannot work without (#233): ticket routes fail with `status_missing` when a
 * status is absent. Created by the API at startup and by prisma/seed.ts, both idempotently,
 * so a database set up with `migrate deploy` (no seed) works too.
 */
export const TICKET_STATUSES = [
    {name: 'waiting', label: 'Non-Assignée'},
    {name: 'started', label: 'En cours'},
    {name: 'closed', label: 'En attente de transmission'},
    {name: 'commented', label: 'Terminée'},
] as const;

/** Shared volunteers' channel; its id is hard-coded across the app. */
export const PUBLIC_CHANNEL = {id: '1', name: 'Discussion BE libre'} as const;

/** The part of a Prisma client this needs, so tests can pass a fake. */
export interface BaseDataDb {
    ticketStatus: {upsert: (args: {where: {name: string}; update: object; create: {name: string; label: string}}) => Promise<unknown>};
    channel: {upsert: (args: {where: {id: string}; update: object; create: {id: string; name: string}}) => Promise<unknown>};
}

/** Creates what is missing and never overwrites existing rows (labels may have been edited). */
export async function ensureBaseData(db: BaseDataDb) {
    for (const status of TICKET_STATUSES) {
        await db.ticketStatus.upsert({where: {name: status.name}, update: {}, create: {...status}});
    }
    await db.channel.upsert({where: {id: PUBLIC_CHANNEL.id}, update: {}, create: {...PUBLIC_CHANNEL}});
}
