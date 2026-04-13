import {RolesManager} from "@/components/admin/roles-manager";
import {Page} from "@/components/ui/page";

export default function RolesPage() {
    return (
        <Page
            title="Gestion des rôles"
            description="Gérez les permissions et la hiérarchie des rôles de l'association."
        >
            <RolesManager/>
        </Page>
    );
}
