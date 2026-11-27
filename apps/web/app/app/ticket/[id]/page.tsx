import {redirect} from "next/navigation";
import {Chat} from "@/components/chat";
import prisma from "@/lib/prisma";
import {can, getAccess} from "@/lib/userPermissions";

import {constructMetadata} from "@/lib/metadata";
import {Page} from "@/components/ui";

export const metadata = constructMetadata({
    title: "Détails de l'écoute",
    noIndex: true,
});

/**
 * Only for those who may read the écoute (same rule as the API's channel access, #270): those
 * who read every écoute, its volunteer, and a trainee a manager allowed to observe it. Anyone
 * else learns nothing, not even that it exists.
 */
export default async function TicketChat({
                                             params
                                         }: {
    params: Promise<{ id: string }>
}) {
    const {id} = await params;
    const access = await getAccess();
    if (!access || typeof id !== "string" || id.length > 64) redirect("/app");

    const ticket = await prisma.ticket.findUnique({
        where: {channelId: id},
        select: {
            id: true,
            assignedUserId: true,
            statusName: true,
            status: {select: {id: true}},
            spectators: {where: {userId: access.userId, status: "approved"}, select: {id: true}},
        },
    });
    const allowed = !!ticket && (
        can(access.permissions, "tickets.read_all")
        || (ticket.assignedUserId === access.userId && can(access.permissions, "tickets.send_message"))
        || (ticket.statusName === "started" && ticket.spectators.length > 0 && can(access.permissions, "tickets.spectate"))
    );
    if (!ticket || !allowed) redirect("/app");

    return (
        <Page title={`Écoute ${String(ticket.id).padStart(5, "0")}`} description="Suivi de l'écoute" className="p-0" hideHeader>
            <Chat channelID={id} statusID={ticket.status.id}/>
        </Page>
    );
}
