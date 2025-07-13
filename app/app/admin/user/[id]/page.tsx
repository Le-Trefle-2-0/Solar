import {Tickets} from "@/lib/interface";
import prisma from "@/lib/prisma";
import {TicketsTable} from "./tickets-table";

async function getData(id: string): Promise<Tickets[]> {
    // Fetch data from your API here.
    const tickets = await prisma.ticket.findMany({
        where: {
            assignedUserId: id
        }
    });
    return tickets.map(ticket => ({
        id: ticket.id,
        status: ticket.statusLabel,
        createdAt: new Date(ticket.createdAt),
        problematic: ticket.problematic,
        observations: ticket.observations,
        info: ticket.info
    }));
}

export default async function TicketChat({
                                             params
                                         }: {
    params: Promise<{ id: string }>
}) {
    const {id} = await params;
    const data = await getData(id)

    return (
        <div>
            <div className="container mx-auto p-6">
                <TicketsTable data={data}/>
            </div>
        </div>
    );
}