import prisma from "@/lib/prisma";
import {can, getAccess} from "@/lib/userPermissions";
import {HistoryTable} from "../../history/history-table";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {redirect} from "next/navigation";
import {Avatar, AvatarFallback, AvatarImage, Page} from "@/components/ui";

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
    // Profiles and their listening history: for those who manage accounts or see members (#270)
    const access = await getAccess();
    if (!access || !(can(access.permissions, "management.manage_accounts") || can(access.permissions, "users.read_all"))) {
        return redirect("/app");
    }
    const user = await prisma.user.findUnique({
        where: {id},
        select: {id: true, name: true, displayUsername: true, image: true, createdAt: true},
    });
    if (!user) return redirect("/app")

    return (
        <Page title={`Profil de ${user.displayUsername || user.name}`} description={`ID: ${user.id}`}>
            <div className="flex flex-col gap-6">
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
        </Page>
    );
}