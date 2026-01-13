import {prisma} from '../prisma.js';

export async function channelInfo(channelID: string) {
    const channel = await prisma.channel.findUnique({where: {id: channelID}});
    if (!channel) {
        return null;
    }

    return channel;
}

export async function createChannel(name: string) {
    const channel = await prisma.channel.create({
        data: {name}
    });

    return channel;
}
