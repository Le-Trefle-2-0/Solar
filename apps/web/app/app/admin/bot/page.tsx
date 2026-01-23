import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {BotClient} from "@/components/admin/bot-client";

export default async function BotAdminPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) redirect('/auth/sign-in');

    const userRoles = ((session.user as any).role || "").split(",").map((r: string) => r.trim());
    if (!userRoles.includes("admin")) {
        redirect("/app");
    }

    return <BotClient/>;
}
