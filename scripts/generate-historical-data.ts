import {PrismaClient} from '../generated/prisma';
import {faker} from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting data generation...');

    // 1. Ensure Ticket Statuses exist
    const statuses = [
        {name: 'waiting', label: 'Non-Assignée'},
        {name: 'started', label: 'En cours'},
        {name: 'closed', label: 'En attente de transmission'},
        {name: 'commented', label: 'Terminée'},
    ];

    for (const status of statuses) {
        await prisma.ticketStatus.upsert({
            where: {name: status.name},
            update: {},
            create: status,
        });
    }

    // 2. Create fake users (Team members / agents)
    const fakeUsersCount = 10;
    const users = [];
    for (let i = 0; i < fakeUsersCount; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const user = await prisma.user.upsert({
            where: {email: faker.internet.email({firstName, lastName})},
            update: {},
            create: {
                id: faker.string.uuid(),
                name: `${firstName} ${lastName}`,
                email: faker.internet.email({firstName, lastName}),
                emailVerified: true,
                image: faker.image.avatar(),
                createdAt: faker.date.past({years: 3}),
                updatedAt: new Date(),
                role: 'agent',
                username: faker.internet.username({firstName, lastName}),
                displayUsername: firstName,
            },
        });
        users.push(user);
    }
    console.log(`Created ${users.length} fake users.`);

    // 3. Ensure a default channel exists
    const channel = await prisma.channel.upsert({
        where: {id_name: {id: '1', name: 'Discussion BE libre'}},
        update: {},
        create: {
            id: '1',
            name: 'Discussion BE libre',
        },
    });

    // 4. Generate historical tickets
    const totalTickets = 3000;
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    console.log(`Generating ${totalTickets} tickets over 2 years...`);

    for (let i = 0; i < totalTickets; i++) {
        const createdAt = faker.date.between({from: twoYearsAgo, to: new Date()});
        const updatedAt = new Date(createdAt);
        updatedAt.setHours(updatedAt.getHours() + faker.number.int({min: 1, max: 48}));

        let status;
        if (i < 3) {
            status = statuses.find((s) => s.name === 'waiting')!;
        } else if (i < 3 + 5) {
            status = statuses.find((s) => s.name === 'started')!;
        } else if (i < 3 + 5 + 20) {
            // "Only a few just closed without comments"
            status = statuses.find((s) => s.name === 'closed')!;
        } else {
            // "The rest should be commented"
            status = statuses.find((s) => s.name === 'commented')!;
        }

        const assignedUser = status.name === 'waiting' ? null : faker.helpers.arrayElement(users);

        const ticketChannel = await prisma.channel.create({
            data: {
                id: faker.string.numeric(18),
                name: `ticket-${faker.string.alphanumeric(5)}`,
            },
        });

        const hasFeedback = status.name === 'commented';
        const feedback = hasFeedback ? {
            rating: faker.number.int({min: 1, max: 5}),
            comment: faker.lorem.sentence(),
        } : null;

        const ticket = await prisma.ticket.create({
            data: {
                discordUserID: faker.string.numeric(18),
                source: 'discord',
                createdAt,
                updatedAt,
                statusName: status.name,
                statusLabel: status.label,
                assignedUserId: assignedUser?.id,
                channelId: ticketChannel.id,
                channelName: ticketChannel.name,
                problematic: faker.lorem.sentence().substring(0, 191),
                observations: faker.lorem.sentence().substring(0, 191),
                info: faker.lorem.sentence().substring(0, 191),
                voice: faker.datatype.boolean(),
                categories: [faker.commerce.department(), faker.commerce.department()],
                feedback: feedback as any,
            },
        });

        // 5. Generate messages for each ticket
        const messageCount = faker.number.int({min: 2, max: 10});
        for (let j = 0; j < messageCount; j++) {
            const msgCreatedAt = new Date(createdAt);
            msgCreatedAt.setMinutes(msgCreatedAt.getMinutes() + j * 10);

            await prisma.message.create({
                data: {
                    createdAt: msgCreatedAt,
                    userId: faker.helpers.maybe(() => faker.helpers.arrayElement(users).id, {probability: 0.5}),
                    channelId: channel.id,
                    content: Buffer.from(faker.lorem.sentence()),
                    ticketId: ticket.id,
                },
            });
        }

        if (i % 50 === 0) {
            console.log(`Generated ${i} tickets...`);
        }
    }

    console.log('Data generation completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
