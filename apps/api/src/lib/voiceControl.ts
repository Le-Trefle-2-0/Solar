import {prisma} from '../prisma.js';
import {broadcast} from './broadcast.js';

/** Asks the voice service to close a room: everyone in it is disconnected. */
export async function closeVoiceRoom(type: 'ticket' | 'permanence', channelId: string): Promise<void> {
    const base = (process.env.VOICE_INTERNAL_URL || 'http://localhost:3003').replace(/\/$/, '');
    try {
        await fetch(`${base}/internal/rooms/close`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`},
            body: JSON.stringify({type, channelId}),
            signal: AbortSignal.timeout(3000),
        });
    } catch (e) {
        // The service may be down: the ticket is still switched back to text below
        console.warn('[voice] could not close room', channelId, e);
    }
}

/**
 * Ends a voice écoute: back to text, the call is closed for both sides and the widget removes
 * its call card. Used when the volunteer ends the call and when the écoute is closed.
 */
export async function endVoiceCall(channelId: string): Promise<void> {
    const updated = await prisma.ticket.updateMany({where: {channelId, voice: true}, data: {voice: false}});
    await closeVoiceRoom('ticket', channelId);
    if (updated.count > 0) await broadcast(channelId, 'ticketVoice', {channelId, voice: false});
}
