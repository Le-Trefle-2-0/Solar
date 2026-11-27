import {hasPermission} from './roleAssignment.js';

/**
 * Observing an écoute: a volunteer in training (tickets.spectate) asks from the permanence's
 * channel; a manager (tickets.attribute) approves by choosing an écoute in progress, which the
 * trainee then reads, never writes, until it ends; or refuses. Both are written in the écoute's
 * transcript as team notes.
 */

export type SpectateStatus = 'pending' | 'approved' | 'refused' | 'ended';

export type SpectateRow = {
    id: string;
    eventId: string;
    userId: string;
    status: string;
    ticket: {id: number; channelId: string | null; statusName: string} | null;
};

/** Still going on: waiting for a manager, or approved on an écoute still in progress. */
export function isOpenRequest(r: Pick<SpectateRow, 'status' | 'ticket'>): boolean {
    if (r.status === 'pending') return true;
    return r.status === 'approved' && r.ticket?.statusName === 'started';
}

export type RequestRefusal = 'forbidden' | 'no_permanence' | 'wrong_channel' | 'already_requested';

/** Asking is for trainees, from the channel of the permanence on now, one request at a time. */
export function requestRefusal(input: {
    permissions: string[];
    permanenceChannelId: string | null;
    channelId: unknown;
    hasOpenRequest: boolean;
}): RequestRefusal | null {
    if (!hasPermission(input.permissions, 'tickets.spectate')) return 'forbidden';
    if (!input.permanenceChannelId) return 'no_permanence';
    if (input.channelId !== input.permanenceChannelId) return 'wrong_channel';
    if (input.hasOpenRequest) return 'already_requested';
    return null;
}

export const ticketReference = (id: number) => String(id).padStart(5, '0');
