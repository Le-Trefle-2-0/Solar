'use client';

import {useEffect, useState} from "react";
import {UsersTable} from "./users-table"
import {DisplayAccount} from "@/lib/interface";
import {apiFetch} from "@/lib/api";
import {authClient} from "@/lib/auth-client";
import {useRouter} from "next/navigation";

export default function Admin() {
    const {data: session, isPending} = authClient.useSession();
    const router = useRouter();
    const [data, setData] = useState<DisplayAccount[]>([]);
    const [loading, setLoading] = useState(true);

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

            apiFetch('/v1/admin/users')
                .then(setData)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [session, isPending, router]);

    if (isPending || loading) {
        return <div className="flex h-screen w-full items-center justify-center">Chargement...</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <UsersTable data={data}/>
        </div>
    )
}