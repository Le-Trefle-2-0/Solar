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
    const userPermissions = (session.user as any).permissions || [];
    if (!userRoles.includes("admin") && !userRoles.includes("manager") && !userPermissions.includes("admin.sudo")) {
        redirect("/app");
    }

    let initialSettings = {
        widget_enabled: true,
        monitoring_categories: [] as string[],
        planning_default_slots: [] as any[]
    };

    let roles: any[] = [];

    try {
        roles = await prisma.role.findMany({
            orderBy: {
                weight: 'desc'
            }
        });

        const settings = await prisma.settings.findMany();

        const widgetEnabledSetting = settings.find(s => s.key === "widget_enabled");
        initialSettings.widget_enabled = widgetEnabledSetting ? widgetEnabledSetting.value === "true" : true;

        const monitoringCategoriesSetting = settings.find(s => s.key === "monitoring_categories");
        if (monitoringCategoriesSetting) {
            try {
                initialSettings.monitoring_categories = JSON.parse(monitoringCategoriesSetting.value);
            } catch (e) {
                console.error("Failed to parse monitoring_categories", e);
            }
        }

        const planningDefaultSlotsSetting = settings.find(s => s.key === "planning_default_slots");
        if (planningDefaultSlotsSetting) {
            try {
                initialSettings.planning_default_slots = JSON.parse(planningDefaultSlotsSetting.value);
            } catch (e) {
                console.error("Failed to parse planning_default_slots", e);
            }
        }
    } catch (e) {
        console.error("[Settings] Failed to fetch settings in admin:", e);
    }

    return (
        <Page title="Paramètres globaux" description="Configurez les options générales de l'application">
            <AdminSettingsView initialSettings={initialSettings} roles={roles}/>
        </Page>
    );
}
