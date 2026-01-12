import prisma from "@/lib/prisma";
import {HistoryTable} from "../../history/history-table";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {redirect} from "next/navigation";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui";

import {constructMetadata} from "@/lib/metadata";

export const metadata = constructMetadata({
    title: "Profil Utilisateur",
    noIndex: true,
});

export default async function UserDetail({
                                             params
                                         }: {
    params: Promise<{ id: string }>
}) {
    const {id} = await params;
    const user = await prisma.user.findUnique({where: {id}});
    if (!user) return redirect("/app")

    return (
        <div className="p-6 mt-6 flex flex-col gap-6 overflow-auto">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-16 w-16 rounded-lg">
                        <AvatarImage src={user.image || undefined}/>
                        <AvatarFallback>
                            {(user.displayUsername || user.name).split(/\s+/).filter(word => word).map(word => word[0].toUpperCase()).join("")}
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
                    <HistoryTable userId={id}/>
                </CardContent>
            </Card>
        </div>
    );
}