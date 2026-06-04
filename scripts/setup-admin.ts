import {PrismaClient} from "@prisma/client";
import {generateRandomString, hashPassword} from "better-auth/crypto";
import * as readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const question = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
    console.log("--- Solar Admin Setup Tool ---");

    const name = await question("Admin Name: ");
    const email = await question("Admin Email: ");
    const password = await question("Admin Password: ");

    if (!name || !email || !password) {
        console.error("All fields are required.");
        process.exit(1);
    }

    try {
        const hashedPassword = await hashPassword(password);
        const userId = generateRandomString(32);

        // Ensure default roles exist
        const adminRole = await prisma.role.upsert({
            where: {name: "admin"},
            update: {},
            create: {
                name: "admin",
                weight: 100,
                permissions: JSON.stringify([
                    "tickets.open", "tickets.close", "tickets.read_all", "tickets.attribute", "tickets.launch_voice",
                    "tickets.send_message_all", "tickets.send_message", "tickets.transmission",
                    "management.create_account", "management.delete_account", "management.ticket_history",
                    "management.view_transmission", "management.view_stats", "management.reset_password",
                    "permanence.open", "permanence.close", "permanence.register", "permanence.unregister",
                    "permanence.unregister_other_all", "permanence.unregister_other_user", "permanence.register_other_all", "permanence.register_other_user",
                    "messages.manage", "newsletters.manage",
                    "user.create", "user.update", "user.delete", "user.read", "session.delete", "session.read", "impersonate.create"
                ]),
                icon: "Shield"
            }
        });

        const volunteerRole = await prisma.role.upsert({
            where: {name: "volunteer"},
            update: {},
            create: {
                name: "volunteer",
                weight: 10,
                permissions: JSON.stringify([
                    "tickets.close", "tickets.launch_voice", "tickets.send_message", "tickets.transmission",
                    "management.view_stats",
                    "permanence.register", "permanence.unregister"
                ]),
                icon: "Ear"
            }
        });

        await prisma.user.create({
            data: {
                id: userId,
                name: name,
                email: email.toLowerCase(),
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                role: "admin",
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
        });

        console.log(`Successfully created admin user: ${email} and ensured default roles (admin, volunteer) exist.`);
    } catch (error) {
        console.error("Error creating admin user:", error);
    } finally {
        await prisma.$disconnect();
        rl.close();
    }
}

main();
