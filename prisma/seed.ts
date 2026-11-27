import {PrismaClient} from '../generated/prisma'
import {DEFAULT_ROLES} from '../apps/api/src/lib/defaultRoles'
import {ensureBaseData} from '../apps/api/src/lib/baseData'

const prisma = new PrismaClient()

async function main() {
    // Ticket statuses and the public channel (the API also ensures them at startup, #233)
    await ensureBaseData(prisma)

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
