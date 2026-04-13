import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {HistoryTable} from "./history-table";
import {Page} from "@/components/ui";

import {constructMetadata} from "@/lib/metadata";

export const metadata = constructMetadata({
    title: "Historique",
    noIndex: true,
});

export default async function HistoryPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) redirect('/auth/sign-in');

    const userRoles = ((session.user as any).role || "").split(",").map((r: string) => r.trim());
    const isAllowed = userRoles.includes("admin") || userRoles.includes("manager");

    if (!isAllowed) {
        redirect("/app");
    }

    return (
        <Page title="Historique des écoutes" description="Consultez les échanges passés et les statistiques">
            <HistoryTable/>
        </Page>
    )
}
