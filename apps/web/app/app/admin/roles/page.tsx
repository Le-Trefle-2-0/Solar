import {RolesManager} from "@/components/admin/roles-manager";
import {Page} from "@/components/ui";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

export default async function RolesPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) redirect('/auth/sign-in');

    const userRoles = ((session.user as any).role || "").split(",").map((r: string) => r.trim());
    const userPermissions = (session.user as any).permissions || [];
    const isAllowed = userRoles.includes("admin") || userRoles.includes("manager") || userPermissions.includes("admin.sudo");

    if (!isAllowed) {
        redirect("/app");
    }

    return (
        <Page
            title="Gestion des rôles"
            description="Gérez les permissions et la hiérarchie des rôles de l'association."
        >
            <RolesManager/>
        </Page>
    );
}
