'use client';

import {useEffect} from "react";
import {HistoryChat} from "@/components/history/history-chat";
import {authClient} from "@/lib/auth-client";
import {useRouter, useSearchParams} from "next/navigation";

export default function HistoryDetailPage() {
    const {data: session, isPending} = authClient.useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const channelId = searchParams.get('channelId');

    useEffect(() => {
        if (!isPending && !session) {
            router.push('/auth/sign-in');
            return;
        }

        if (session) {
            const userRoles = ((session.user as any).role || "").split(",").map((r: string) => r.trim());
            if (!userRoles.includes("admin") && !userRoles.includes("manager")) {
                router.push("/");
                return;
            }
        }
    }, [session, isPending, router]);

    if (isPending) return <div className="flex h-screen w-full items-center justify-center">Chargement...</div>;
    if (!session || !channelId) return null;

    return (
        <HistoryChat channelId={channelId}/>
    );
}
