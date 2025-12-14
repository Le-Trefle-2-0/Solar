import prisma from "@/lib/prisma";
import {createChannel} from "@/lib/channelsManager";

export async function createTicket(id: string) {
    const status = await prisma.ticketStatus.findUnique({
        where: {
            name: 'waiting'
        }
    });
    const ticket = await prisma.ticket.create({
        data: {
            discordUserID: id,
            createdAt: new Date(),
            updatedAt: new Date(),
            statusName: status?.name as string,
            statusLabel: status?.label as string,
        }
    });

    let channelName = ticket.id.toString();
    while (channelName.length < 5) {
        channelName = "0" + channelName;
    }

    channelName = "Ecoute-" + channelName;

    const channel = await createChannel(channelName);
    return prisma.ticket.update({
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
}

export async function findTicket(discordUserID: string) {
    return await prisma.ticket.findFirst({
        where: {
            discordUserID
        }
    });
}