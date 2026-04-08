import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {BotClient} from "@/components/admin/bot-client";

import {constructMetadata} from "@/lib/metadata";
import {Page} from "@/components/ui";

export const metadata = constructMetadata({
    title: "Gestion du Bot",
    noIndex: true,
});

export default async function BotAdminPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) redirect('/auth/sign-in');

    const userRoles = ((session.user as any).role || "").split(",").map((r: string) => r.trim());
    if (!userRoles.includes("admin")) {
        redirect("/app");
    }

    return (
        <Page title="Gestion du Bot" description="Configurez le comportement du bot Discord">
            <BotClient/>
        </Page>
    );
}
