import {Chat} from "@/components/chat";
import prisma from "@/lib/prisma";

import {constructMetadata} from "@/lib/metadata";
import {Page} from "@/components/ui";

export const metadata = constructMetadata({
    title: "Détails de l'écoute",
    noIndex: true,
});

export default async function TicketChat({
                                             params
                                         }: {
    params: Promise<{ id: string, status: number }>
}) {
    const {id, status} = await params;
    const ticket = await prisma.ticket.findUnique({
        where: {
            channelId: id as string
        },
        include: {
            status: true
        }
    })

    return (
        <Page title={`Ticket #${ticket?.id || id}`} description={`Suivi de l'écoute sur le canal ${id}`}
              className="p-0" hideHeader>
            <Chat channelID={id as string} statusID={ticket?.status.id as number}/>
        </Page>
    );
}