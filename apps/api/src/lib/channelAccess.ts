import {prisma} from '../prisma.js';
import {getUserPermissions} from './permissions.js';
import {hasPermission} from './roleAssignment.js';

/**
 * Who may read or write a channel. Same rules as apps/web/lib/security/channelAccess.ts,
 * used by every channel route and by the WebSocket service (through /v1/internal/ws/*).
 *
 * Open channels (the shared volunteers' channel and every permanence's channel) are for every
 * signed-in member, whatever their permissions and whether or not they signed up for the
 * permanence. Ticket channels are for the assigned volunteer and those who may read every ticket,
 * and, read-only, for the volunteers in training a manager allowed to observe the écoute.
 */

/** The shared volunteers' channel. */
export const PUBLIC_CHANNEL_ID = '1';

export interface ChannelAccessInput {
    channelId: string;
    userId: string;
    permissions: string[];
    /** Volunteer assigned to the ticket behind this channel; null if none or no ticket. */
    assignedUserId: string | null;
    /** The channel of a permanence (planning event). */
    isPermanence?: boolean;
    /** Volunteers in training allowed to observe this écoute while it is in progress. */
    spectatorIds?: string[];
}

const isOpen = ({channelId, isPermanence}: ChannelAccessInput) => channelId === PUBLIC_CHANNEL_ID || !!isPermanence;

export function canReadChannel(input: ChannelAccessInput): boolean {
    if (isOpen(input)) return true;
    if (hasPermission(input.permissions, 'tickets.read_all')) return true;
    // Observing, read-only: approved by a manager, and still allowed by the role
    if (input.spectatorIds?.includes(input.userId) && hasPermission(input.permissions, 'tickets.spectate')) return true;
    // Being assigned is not enough on its own: the role must still allow listening (#249)
    return input.assignedUserId !== null && input.assignedUserId === input.userId
        && hasPermission(input.permissions, 'tickets.send_message');
}

/**
 * Acting on a ticket itself (details, notes, categories, transmission): tickets.read_all, or being
 * assigned to it with a role that still allows listening (#249).
 */
export function canAccessTicket(permissions: string[], assignedUserId: string | null | undefined, userId: string): boolean {
    if (hasPermission(permissions, 'tickets.read_all')) return true;
    return !!assignedUserId && assignedUserId === userId && hasPermission(permissions, 'tickets.send_message');
}

export function canWriteChannel(input: ChannelAccessInput): boolean {
    if (isOpen(input)) return true;
    if (hasPermission(input.permissions, 'tickets.send_message_all')) return true;
    return input.assignedUserId !== null && input.assignedUserId === input.userId
        && hasPermission(input.permissions, 'tickets.send_message');
}

/** A permanence's text channel (Event.channelID). */
export async function isPermanenceChannel(channelId: string): Promise<boolean> {
    if (channelId === PUBLIC_CHANNEL_ID) return false;
    return !!(await prisma.event.findFirst({where: {channelID: channelId}, select: {id: true}}));
}

export type TicketAccessRow = {assignedUserId: string | null; spectatorIds?: string[]};

/** Who an écoute is for: its volunteer, and the trainees observing it while it is in progress. */
export async function findTicketAccess(channelId: string): Promise<TicketAccessRow | null> {
    const ticket = await prisma.ticket.findUnique({
        where: {channelId},
        select: {
            assignedUserId: true,
            statusName: true,
            spectators: {where: {status: 'approved'}, select: {userId: true}},
        },
    });
    if (!ticket) return null;
    return {
        assignedUserId: ticket.assignedUserId,
        // Observing ends with the écoute itself
        spectatorIds: ticket.statusName === 'started' ? ticket.spectators.map(s => s.userId) : [],
    };
}

/** What a channel is, for the access rules: its ticket's assignee and observers, or a permanence channel. */
export async function describeChannel(
    channelId: string,
    findTicket: (channelId: string) => Promise<TicketAccessRow | null>,
    isPermanence: (channelId: string) => Promise<boolean>,
): Promise<{assignedUserId: string | null; isPermanence: boolean; spectatorIds: string[]}> {
    if (channelId === PUBLIC_CHANNEL_ID) return {assignedUserId: null, isPermanence: false, spectatorIds: []};
    const ticket = await findTicket(channelId);
    if (ticket) return {assignedUserId: ticket.assignedUserId, isPermanence: false, spectatorIds: ticket.spectatorIds ?? []};
    return {assignedUserId: null, isPermanence: await isPermanence(channelId), spectatorIds: []};
}

export async function getChannelAccess(userId: string, channelId: string, permissions?: string[]) {
    const [perms, channel] = await Promise.all([
        permissions ? Promise.resolve(permissions) : getUserPermissions(userId),
        describeChannel(channelId, findTicketAccess, isPermanenceChannel),
    ]);
    const input = {channelId, userId, permissions: perms, ...channel};
    return {read: canReadChannel(input), write: canWriteChannel(input)};
}
