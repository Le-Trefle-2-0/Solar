import {z} from "zod";

/** The shared volunteers' channel, open to every signed-in user. */
export const PUBLIC_CHANNEL_ID = "1";

export const MESSAGE_MAX_LENGTH = 2000;

/**
 * What a client may send to the saveMessage server action. The author is never
 * part of it: it always comes from the session (#238).
 */
export const MessageInputSchema = z.object({
    channelId: z.string().min(1).max(64),
    content: z.string().min(1).max(MESSAGE_MAX_LENGTH),
    replyID: z.number().int().positive().nullable().optional(),
}).strict();

export type MessageInput = z.infer<typeof MessageInputSchema>;

function has(permissions: string[], permission: string) {
    return permissions.includes("admin.sudo") || permissions.includes(permission);
}

export interface ChannelAccess {
    channelId: string;
    userId: string;
    permissions: string[];
    /** Volunteer assigned to the ticket behind this channel; null if none or no ticket. */
    assignedUserId: string | null;
    /** The channel of a permanence (planning event): open to every signed-in member. */
    isPermanence?: boolean;
}

/** Read rule shared with GET /v1/messages/:channelId. */
export function canReadChannel({channelId, userId, permissions, assignedUserId, isPermanence}: ChannelAccess): boolean {
    if (channelId === PUBLIC_CHANNEL_ID || isPermanence) return true;
    if (has(permissions, "tickets.read_all")) return true;
    // Being assigned is not enough on its own: the role must still allow listening (#249)
    return assignedUserId !== null && assignedUserId === userId && has(permissions, "tickets.send_message");
}

/** Write rule: open channels, tickets.send_message_all, or the assigned volunteer with tickets.send_message. */
export function canWriteChannel({channelId, userId, permissions, assignedUserId, isPermanence}: ChannelAccess): boolean {
    if (channelId === PUBLIC_CHANNEL_ID || isPermanence) return true;
    if (has(permissions, "tickets.send_message_all")) return true;
    return assignedUserId !== null && assignedUserId === userId && has(permissions, "tickets.send_message");
}
