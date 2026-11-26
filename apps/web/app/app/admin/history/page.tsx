import {auth} from "@/lib/auth";
import {can, getAccess} from "@/lib/userPermissions";
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

    // Permission-based: role names grant nothing by themselves
    const access = await getAccess();
    if (!access || !can(access.permissions, 'management.ticket_history')) {
        redirect("/app");
    }

    return (
        <Page title="Historique des écoutes" description="Consultez les échanges passés et les statistiques">
            <HistoryTable/>
        </Page>
    )
}
