'use client';

import {useEffect} from "react";
import {authClient} from "@/lib/auth-client";
import {useRouter} from "next/navigation";
import {HistoryTable} from "./history-table";

export default function HistoryPage() {
    const {data: session, isPending} = authClient.useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isPending && !session) {
            router.push('/auth/sign-in');
            return;
        }

        if (session) {
            const userRoles = ((session.user as any).role || "").split(",").map((r: string) => r.trim());
            const isAllowed = userRoles.includes("admin") || userRoles.includes("manager");
            if (!isAllowed) {
                router.push("/");
            }
        }
    }, [session, isPending, router]);

    if (isPending) return <div className="flex h-screen w-full items-center justify-center">Chargement...</div>;
    if (!session) return null;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Historique des écoutes</h1>
            <HistoryTable/>
        </div>
    )
}
