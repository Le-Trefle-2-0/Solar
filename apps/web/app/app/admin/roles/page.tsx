import {RolesManager} from "@/components/admin/roles-manager";
import {can, getAccess} from "@/lib/userPermissions";
import {Page} from "@/components/ui";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

export default async function RolesPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) redirect('/auth/sign-in');

    // Permission-based: role names grant nothing by themselves
    const access = await getAccess();
    if (!access || !can(access.permissions, 'roles.manage')) {
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
