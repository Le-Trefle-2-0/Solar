import {UsersTable} from "./users-table"
import {DisplayAccount} from "@/lib/interface";
import prisma from "@/lib/prisma";
import {subDays} from "date-fns";

async function getData(): Promise<DisplayAccount[]> {
    // Fetch data from your API here.
    const accountsWithLatestTicket = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            Ticket: {
                where: {
                    createdAt: {
                        gte: subDays(new Date(), 90),
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 1, // latest ticket only
                select: {
                    createdAt: true,
                }
            },
        },
    });

    // Map user with the latest ticket date
    return accountsWithLatestTicket.map(acc => ({
        id: acc.id,
        name: acc.name,
        username: acc.username as string,
        email: acc.email,
        role: acc.role as string,
        lastTicketTimestamp: acc.Ticket.length > 0 ? acc.Ticket[0].createdAt.getTime() : 0,
    }));
}

export default async function Admin() {
    const data = await getData()

    return (
        <div className="container mx-auto p-6">
            <UsersTable data={data}/>
        </div>
    )
}