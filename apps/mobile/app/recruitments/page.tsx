'use client';

import {useEffect, useState} from "react";
import {authClient} from "@/lib/auth-client";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api";
import {RecruitmentClient} from "@/components/recruitments/recruitment-client";

export default function RecruitmentsPage() {
    const {data: session, isPending} = authClient.useSession();
    const router = useRouter();
    const [recruitments, setRecruitments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isPending && !session) {
            router.push('/');
            return;
        }

        if (session) {
            const userRoles = ((session.user as any).role || "").split(",").map((r: string) => r.trim());
            if (!userRoles.includes("admin") && !userRoles.includes("manager")) {
                router.push("/");
                return;
            }

            apiFetch('/v1/recruitments')
                .then(setRecruitments)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [session, isPending, router]);

    if (isPending || loading) {
        return <div className="flex h-screen w-full items-center justify-center">Chargement...</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-16 overflow-auto h-full">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Recrutements</h2>
            </div>
            <RecruitmentClient initialData={recruitments}/>
        </div>
    );
}
