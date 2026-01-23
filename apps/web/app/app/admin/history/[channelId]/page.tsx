import {HistoryChat} from "@/components/history/history-chat";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

import {constructMetadata} from "@/lib/metadata";

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

    const userRoles = ((session.user as any).role || "").split(",").map((r: string) => r.trim());
    if (!userRoles.includes("admin") && !userRoles.includes("manager")) {
        redirect("/app");
    }

    const {channelId} = await params;

    return (
        <HistoryChat channelId={channelId}/>
    );
}
