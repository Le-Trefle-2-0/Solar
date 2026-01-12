'use client';

import {useEffect} from "react";
import {authClient} from "@/lib/auth-client";
import {useRouter} from "next/navigation";
import {BotClient} from "@/components/admin/bot-client";

export default function BotAdminPage() {
    const {data: session, isPending} = authClient.useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isPending && !session) {
            router.push('/auth/sign-in');
            return;
        }

        if (session) {
            const userRoles = ((session.user as any).role || "").split(",").map((r: string) => r.trim());
            if (!userRoles.includes("admin") && !userRoles.includes("manager")) {
                router.push("/");
            }
        }
    }, [session, isPending, router]);

    if (isPending) return <div className="flex h-screen w-full items-center justify-center">Chargement...</div>;
    if (!session) return null;

    return <BotClient/>;
}
