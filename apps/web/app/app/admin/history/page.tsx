import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {HistoryTable} from "./history-table";

export default async function HistoryPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) redirect('/auth/sign-in');

    const userRoles = ((session.user as any).role || "").split(",").map((r: string) => r.trim());
    const isAllowed = userRoles.includes("admin") || userRoles.includes("manager");

    if (!isAllowed) {
        redirect("/app");
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Historique des écoutes</h1>
            <HistoryTable/>
        </div>
    )
}
