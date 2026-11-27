import {HistoryChat} from "@/components/history/history-chat";
import {can, getAccess} from "@/lib/userPermissions";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

import {constructMetadata} from "@/lib/metadata";
import {Page} from "@/components/ui";

export const metadata = constructMetadata({
    title: "Historique du Salon",
    noIndex: true,
});

export default async function HistoryDetailPage({
                                                    params
                                                }: {
    params: Promise<{ channelId: string }>
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) redirect('/auth/sign-in');

    // Permission-based: role names grant nothing by themselves
    const access = await getAccess();
    if (!access || !can(access.permissions, 'management.ticket_history')) {
        redirect("/app");
    }

    const {channelId} = await params;

    return (
        <Page title="Historique du Salon" description={`Canal: ${channelId}`} className="p-0"
              back={{href: "/app/admin/history", label: "Retour à l'historique"}}>
            <HistoryChat channelId={channelId}/>
        </Page>
    );
}
