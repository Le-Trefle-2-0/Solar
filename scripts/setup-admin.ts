import {PrismaClient} from "../generated/prisma";
import {generateRandomString, hashPassword} from "better-auth/crypto";
import * as readline from "readline";
import {DEFAULT_ROLES} from "../apps/api/src/lib/defaultRoles";

/** Same key as OWNER_SETTING_KEY in apps/api/src/lib/permissions.ts. */
const OWNER_SETTING_KEY = "owner_user_id";

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const question = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
};

/**
 * First-time setup: creates the owner account (holds every permission, sits above every
 * role and cannot be managed by anyone else) and the default roles.
 */
async function main() {
    console.log("--- Solar Owner Setup Tool ---");

    const existingOwner = await prisma.settings.findUnique({where: {key: OWNER_SETTING_KEY}});
    if (existingOwner?.value) {
        console.error("An owner account already exists. Ownership transfer is not supported yet.");
        await prisma.$disconnect();
        rl.close();
        process.exit(1);
    }

    const name = await question("Owner Name: ");
    const email = await question("Owner Email: ");
    const password = await question("Owner Password: ");

    if (!name || !email || !password) {
        console.error("All fields are required.");
        process.exit(1);
    }

    try {
        const hashedPassword = await hashPassword(password);
        const userId = generateRandomString(32);

        // Default roles, on a fresh install only (the roles page owns them afterwards)
        if (await prisma.role.count() === 0) {
            for (const role of DEFAULT_ROLES) {
                await prisma.role.create({
                    data: {name: role.name, weight: role.weight, icon: role.icon, permissions: JSON.stringify(role.permissions)},
                });
            }
        }
        const topRole = await prisma.role.findFirst({orderBy: {weight: "desc"}, select: {name: true}});

        await prisma.$transaction([
            prisma.user.create({
                data: {
                    id: userId,
                    name: name,
                    email: email.toLowerCase(),
                    emailVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    // Cosmetic: the owner holds every permission whatever their roles
                    role: topRole?.name ?? "none",
                    accounts: {
                        create: {
                            id: generateRandomString(32),
                            accountId: userId,
                            providerId: "credential",
                            password: hashedPassword,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                    },
                },
            }),
            prisma.settings.create({data: {key: OWNER_SETTING_KEY, value: userId}}),
        ]);

        console.log(`Owner account created: ${email}.`);
    } catch (error) {
        console.error("Error creating the owner account:", error);
    } finally {
        await prisma.$disconnect();
        rl.close();
    }
}

main();
