import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import prisma from "@/lib/prisma";
import {constructMetadata} from "@/lib/metadata";
import {Page} from "@/components/ui";
import AdminSettingsView from "./view";

export const metadata = constructMetadata({
    title: "Administration • Paramètres",
    noIndex: true,
});

export default async function AdminSettingsPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) redirect('/auth/sign-in');

    const userRoles = ((session.user as any).role || "").split(",").map((r: string) => r.trim());
    if (!userRoles.includes("admin") && !userRoles.includes("manager")) {
        redirect("/app");
    }

    let initialSettings = {
        widget_enabled: true
    };

    try {
        // @ts-ignore
        const widgetEnabledSetting = await prisma.settings.findUnique({
            where: {key: "widget_enabled"}
        });
        initialSettings.widget_enabled = widgetEnabledSetting ? widgetEnabledSetting.value === "true" : true;
    } catch (e) {
        console.error("[Settings] Failed to fetch settings in admin:", e);
    }

    return (
        <Page title="Paramètres globaux" description="Configurez les options générales de l'application">
            <AdminSettingsView initialSettings={initialSettings}/>
        </Page>
    );
}
