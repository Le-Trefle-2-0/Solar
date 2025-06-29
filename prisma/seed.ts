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