import {PrismaClient} from '../generated/prisma'
import {DEFAULT_ROLES} from '../apps/api/src/lib/defaultRoles'

const prisma = new PrismaClient()

async function main() {
    await prisma.channel.create({
        data:
            {
                id: "1",
                name: "Discussion BE libre"
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

    // Default roles, so the first account (the owner) gets the top one at sign-up.
    // The API seeds them too on start; upsert keeps both idempotent.
    for (const role of DEFAULT_ROLES) {
        await prisma.role.upsert({
            where: {name: role.name},
            update: {},
            create: {name: role.name, weight: role.weight, icon: role.icon, permissions: JSON.stringify(role.permissions)},
        });
    }
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
