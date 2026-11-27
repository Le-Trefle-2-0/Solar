import {hasPermission} from './roleAssignment.js';

/**
 * Who is on duty in the current permanence. Volunteers "join" it when they arrive (like the
 * former bot's button), whether they registered on the planning or came as reinforcements;
 * managers see who is there and free, and assign écoutes only to them, one at a time.
 */

/** Joining is possible a little before the start, when volunteers arrive. */
export const JOIN_EARLY_MINUTES = 30;

/** Who may take écoutes, so may join a permanence and be assigned. */
export const TICKET_HANDLER_PERMISSIONS = ['tickets.close', 'tickets.read_all', 'tickets.send_message', 'tickets.send_message_all'];

export const canHandleTickets = (permissions: string[]) => TICKET_HANDLER_PERMISSIONS.some(p => hasPermission(permissions, p));

export type PlanningEvent = {id: string; title: string; start: Date; end: Date; channelID: string};

/** The permanence running now (the one ending last if several), else the one about to start. */
export function pickCurrentPermanence<E extends PlanningEvent>(events: E[], now: Date): E | null {
    const t = now.getTime();
    const running = events
        .filter(e => e.start.getTime() <= t && e.end.getTime() > t)
        .sort((a, b) => b.end.getTime() - a.end.getTime())[0];
    if (running) return running;
    const early = JOIN_EARLY_MINUTES * 60_000;
    return events
        .filter(e => e.start.getTime() > t && e.start.getTime() - early <= t)
        .sort((a, b) => a.start.getTime() - b.start.getTime())[0] ?? null;
}

export type AssignRefusal = 'not_present' | 'busy';

/**
 * Whether an écoute may go to this volunteer: present in the current permanence (when one is
 * on) and not already in another écoute. Outside permanences, écoutes left open can still be
 * handed over, one at a time.
 */
export function assignRefusal(input: {permanenceOn: boolean; present: boolean; otherOpenTicket: boolean}): AssignRefusal | null {
    if (input.permanenceOn && !input.present) return 'not_present';
    if (input.otherOpenTicket) return 'busy';
    return null;
}
