import {prisma} from '../prisma.js';
import {broadcast} from './broadcast.js';
import {pseudonymize} from './pseudonym.js';
import {endVoiceCall} from './voiceControl.js';

/** The écoute's room and the volunteers' lists learn about a status change. */
export async function broadcastStatusUpdate(channelId: string, statusId: number, statusName: string) {
    await broadcast(channelId, 'ticketStatusUpdate', {channelId, statusId, statusName});
    await broadcast(null, 'updateRequest', {channelId});
}

/**
 * Closes an écoute, whoever asks (the volunteer in Solar, or the Discord user through the bot):
 * status "closed" (waiting for its transmission), requester id pseudonymised, call ended, and
 * `ticketClosed` sent to the écoute's room, where the bot listens. The Discord id is never part
 * of the event: the bot already knows who the écoute belongs to.
 */
export async function closeTicket(ticket: {id: number; channelId: string | null; discordUserID: string},
                                  closedBy: 'volunteer' | 'user') {
    const status = await prisma.ticketStatus.findUnique({where: {name: 'closed'}});
    if (!status) throw new Error('status_missing');

    const update = await prisma.ticket.update({
        where: {id: ticket.id},
        include: {status: true},
        data: {
            statusName: status.name,
            statusLabel: status.label,
            discordUserID: pseudonymize(ticket.discordUserID),
        },
    });

    const cid = ticket.channelId;
    if (cid) {
        await broadcastStatusUpdate(cid, status.id, status.name);
        // A closed écoute has no call any more
        await endVoiceCall(cid);
        await broadcast(cid, 'ticketClosed', {ticketId: ticket.id, channelId: cid, statusName: status.name, closedBy});
    }
    return update;
}
