import prisma from "@/lib/prisma";

export async function channelInfo(channelID: string) {
    const channel = await prisma.channel.findUnique({where: {id: channelID}});
    if (!channel) {
        return null;
    }

    return channel;
}