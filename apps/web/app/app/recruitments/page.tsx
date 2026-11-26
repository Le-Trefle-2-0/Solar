import {auth} from "@/lib/auth";
import {can, getAccess} from "@/lib/userPermissions";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {getRecruitments} from "@/app/actions/recruitments";
import {RecruitmentClient} from "@/components/recruitments/recruitment-client";

import {constructMetadata} from "@/lib/metadata";
import {Page} from "@/components/ui";

export const metadata = constructMetadata({
    title: "Gestion des Recrutements",
    noIndex: true,
});

export default async function RecruitmentsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/app");
    }

    // Permission-based: role names grant nothing by themselves
    const access = await getAccess();
    if (!access || !can(access.permissions, 'recruitments.manage')) {
        redirect("/app");
    }

    const recruitments = await getRecruitments();

    return (
        <Page title="Recrutements" description="Gérez les candidatures et les nouveaux membres">
            <RecruitmentClient initialData={recruitments as any}/>
        </Page>
    );
}
