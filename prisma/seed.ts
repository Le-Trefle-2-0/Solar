import {PrismaClient} from '../generated/prisma/client'

const prisma = new PrismaClient()

async function main() {
    await prisma.channel.create({
        data:
            {
                id: "1",
                name: "Permanence"
            }
    });

    let listenChannel = await prisma.channel.create({
        data: {
            name: "Ecoute-00001"
        }
    });

    await prisma.ticket.create({
        data: {
            discordUserID: "369564132770578432",
            channelId: listenChannel.id,
            channelName: listenChannel.name,
            createdAt: new Date(),
            updatedAt: new Date(),
            type: 'ecoute'
        }
    })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })