import prisma from "@/lib/prisma";
import {createChannel} from "@/lib/channelsManager";

export async function createTicket(id: string, source = 'web', metadata: any = {}) {
    console.log(`[ticketManager] Creating ticket for ${id} (source: ${source})`);
    const status = await prisma.ticketStatus.findUnique({
        where: {
            name: 'waiting'
        }
    });

    if (!status) {
        console.error("[ticketManager] Ticket status 'waiting' not found in database");
        throw new Error("Ticket status 'waiting' not found in database");
    }

    try {
        const ticket = await prisma.ticket.create({
            data: {
                discordUserID: id,
                source,
                metadata,
                createdAt: new Date(),
                updatedAt: new Date(),
                statusName: status.name,
                statusLabel: status.label,
            }
        });
        console.log(`[ticketManager] Ticket created with ID: ${ticket.id}`);

        let channelName = ticket.id.toString();
        while (channelName.length < 5) {
            channelName = "0" + channelName;
        }

        channelName = "Ticket-" + channelName;
        console.log(`[ticketManager] Creating channel: ${channelName}`);

        const channel = await createChannel(channelName);
        console.log(`[ticketManager] Channel created with ID: ${channel.id}`);

        const updatedTicket = await prisma.ticket.update({
            where: {
                id: ticket.id
            },
            data: {
                updatedAt: new Date(),
                channelName: channel.name,
                channelId: channel.id
            }
        });
        console.log(`[ticketManager] Ticket ${ticket.id} updated with channel ${channel.id}`);

        return updatedTicket;
    } catch (err) {
        console.error("[ticketManager] Error during ticket/channel creation:", err);
        throw err;
    }
}

export async function findTicket(discordUserID: string) {
    return await prisma.ticket.findFirst({
        where: {
            discordUserID
        }
    });
}