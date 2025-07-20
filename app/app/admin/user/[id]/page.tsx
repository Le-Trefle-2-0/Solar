import {Tickets} from "@/lib/interface";
import prisma from "@/lib/prisma";
import {TicketsTable} from "./tickets-table";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {redirect} from "next/navigation";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui";

async function getData(id: string): Promise<Tickets[]> {
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
        info: ticket.info,
        channelID: ticket.channelId as string,
    }));
}

export default async function TicketChat({
                                             params
                                         }: {
    params: Promise<{ id: string }>
}) {
    const {id} = await params;
    const data = await getData(id)
    const user = await prisma.user.findUnique({where: {id}});
    if (!user) return redirect("/app")

    return (
        <div className="p-6 mt-6 flex flex-col gap-6">
            <Card>
                <CardHeader className="flex flex-row">
                    <Avatar className="rounded-lg">
                        <AvatarImage src={user.image || undefined}/>
                        <AvatarFallback>
                            {(user.displayUsername || user.name).split(/\s+/).filter(word => word).map(word => word[0].toUpperCase()).join("")}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <CardTitle>
                            {user.displayUsername || user.name}
                        </CardTitle>
                        <CardDescription>Créé
                            le {new Date(user.createdAt).toLocaleDateString('fr-FR')}</CardDescription>
                    </div>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>
                        Historique d'écoute
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <TicketsTable data={data}/>
                </CardContent>
            </Card>
            <div className="container mx-auto p-6">
            </div>
        </div>
    );
}