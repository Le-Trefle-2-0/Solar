import {auth} from "@/lib/auth";
import {can, getAccess} from "@/lib/userPermissions";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {Page} from "@/components/ui";
import {constructMetadata} from "@/lib/metadata";
import {StatsView} from "./view";

export const metadata = constructMetadata({
    title: "Statistiques d'activité",
    noIndex: true,
});

export default async function StatsPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) redirect('/auth/sign-in');

    // Permission-based: role names grant nothing by themselves
    const access = await getAccess();
    if (!access || !can(access.permissions, 'management.view_stats')) {
        redirect("/app");
    }

    return (
        <Page
            title="Statistiques d'activité"
            description="Analysez l'impact de l'association et le volume d'écoutes réalisé."
        >
            <StatsView/>
        </Page>
    )
}
