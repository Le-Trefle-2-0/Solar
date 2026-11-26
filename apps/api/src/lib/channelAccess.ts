import {prisma} from '../prisma.js';
import {getUserPermissions} from './permissions.js';
import {hasPermission} from './roleAssignment.js';

/**
 * Who may read or write a channel. Same rules as apps/web/lib/security/channelAccess.ts,
 * used by every channel route and by the WebSocket service (through /v1/internal/ws/*).
 */

/** The shared volunteers' channel, open to every signed-in member. */
export const PUBLIC_CHANNEL_ID = '1';

export interface ChannelAccessInput {
    channelId: string;
    userId: string;
    permissions: string[];
    /** Volunteer assigned to the ticket behind this channel; null if none or no ticket. */
    assignedUserId: string | null;
}

export function canReadChannel({channelId, userId, permissions, assignedUserId}: ChannelAccessInput): boolean {
    if (channelId === PUBLIC_CHANNEL_ID) return true;
    if (hasPermission(permissions, 'tickets.read_all')) return true;
    return assignedUserId !== null && assignedUserId === userId;
}

export function canWriteChannel({channelId, userId, permissions, assignedUserId}: ChannelAccessInput): boolean {
    if (channelId === PUBLIC_CHANNEL_ID) return true;
    if (hasPermission(permissions, 'tickets.send_message_all')) return true;
    return assignedUserId !== null && assignedUserId === userId && hasPermission(permissions, 'tickets.send_message');
}

export async function getChannelAccess(userId: string, channelId: string, permissions?: string[]) {
    const [perms, ticket] = await Promise.all([
        permissions ? Promise.resolve(permissions) : getUserPermissions(userId),
        channelId === PUBLIC_CHANNEL_ID
            ? Promise.resolve(null)
            : prisma.ticket.findUnique({where: {channelId}, select: {assignedUserId: true}}),
    ]);
    const input = {channelId, userId, permissions: perms, assignedUserId: ticket?.assignedUserId ?? null};
    return {read: canReadChannel(input), write: canWriteChannel(input)};
}
