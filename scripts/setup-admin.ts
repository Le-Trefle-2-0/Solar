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

        console.log(`Successfully created admin user: ${email}`);
    } catch (error) {
        console.error("Error creating admin user:", error);
    } finally {
        await prisma.$disconnect();
        rl.close();
    }
}

main();
