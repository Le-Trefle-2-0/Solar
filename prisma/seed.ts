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

    await prisma.ticketStatus.createMany({
        data: [
            {name: "waiting", label: "Non-Assignée"},
            {name: "started", label: "En cours"},
            {name: "closed", label: "En attente de transmission"},
            {name: "commented", label: "Terminée"},
        ]
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