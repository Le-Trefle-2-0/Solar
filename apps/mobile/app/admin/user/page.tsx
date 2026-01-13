'use client';

import {useEffect, useState} from "react";
import {HistoryTable} from "../history/history-table";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useRouter, useSearchParams} from "next/navigation";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui";
import {apiFetch} from "@/lib/api";

export default function UserDetail() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            router.push("/admin");
            return;
        }

        apiFetch(`/v1/admin/users/${id}`)
            .then(setUser)
            .catch(err => {
                console.error(err);
                router.push("/admin");
            })
            .finally(() => setLoading(false));
    }, [id, router]);

    if (loading) return <div className="flex h-screen w-full items-center justify-center">Chargement...</div>;
    if (!user) return null;

    return (
        <div className="p-6 mt-6 flex flex-col gap-6 overflow-auto">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-16 w-16 rounded-lg">
                        <AvatarImage src={user.image || undefined}/>
                        <AvatarFallback>
                            {(user.displayUsername || user.name).split(/\s+/).filter((word: string) => word).map((word: string) => word[0].toUpperCase()).join("")}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <CardTitle className="text-2xl">
                            {user.displayUsername || user.name}
                        </CardTitle>
                        <CardDescription>Compte créé
                            le {new Date(user.createdAt).toLocaleDateString('fr-FR')}</CardDescription>
                    </div>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>
                        Historique d'écoute
                    </CardTitle>
                    <CardDescription>
                        Liste des écoutes passées attribuées à ce bénévole.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <HistoryTable userId={id!}/>
                </CardContent>
            </Card>
        </div>
    );
}