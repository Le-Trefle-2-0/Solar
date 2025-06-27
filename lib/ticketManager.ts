import prisma from "@/lib/prisma";
import {createChannel} from "@/lib/channelsManager";

export async function createTicket(id: string) {
    const ticket = await prisma.ticket.create({
        data: {
            discordUserID: id,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    });

    let channelName = ticket.id.toString();
    while (channelName.length < 5) {
        channelName = "0" + channelName;
    }

    channelName = "Ecoute-" + channelName;

    const channel = await createChannel(channelName);
    const ticketUpdate = await prisma.ticket.update({
        where: {
            id: ticket.id
        },
        data: {
            discordUserID: id,
            updatedAt: new Date(),
            channelName: channel.name,
            channelId: channel.id
        }
    });

    return ticketUpdate;
}