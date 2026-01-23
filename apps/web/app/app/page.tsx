import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import prisma from "@/lib/prisma";
import {format, isAfter} from "date-fns";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import Link from "next/link";
import {constructMetadata} from "@/lib/metadata";

export const metadata = constructMetadata({
    title: "Tableau de bord",
    noIndex: true,
});

export default async function Home() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return (
            <div className="max-w-2xl">
                <p className="text-center">Vous devez être connecté pour accéder au tableau de bord.</p>
            </div>
        );
    }

    const userId = session.user.id as string;
    const now = new Date();

    // Upcoming events the user is registered for
    const registeredEvents = await prisma.event.findMany({
        where: {
            start: {gte: now},
            registrations: {some: {userId}},
        },
        orderBy: {start: 'asc'},
        include: {
            roleSlots: {include: {registrations: true}},
            registrations: {where: {userId}},
        },
        take: 8,
    });

    // Any ticket assigned to the user that appears active
    const assignedTicket = await prisma.ticket.findFirst({
        where: {
            assignedUserId: userId,
            statusName: {in: ["waiting", "started"]},
        },
        orderBy: {updatedAt: 'desc'},
    });

    // Upcoming events that have open slots (need volunteers)
    const upcomingEvents = await prisma.event.findMany({
        where: {start: {gte: now}},
        orderBy: {start: 'asc'},
        include: {roleSlots: {include: {registrations: true}}},
        take: 10,
    });

    const eventsNeedingVolunteers = upcomingEvents
        .map((ev) => ({
            ...ev,
            openSlots: ev.roleSlots
                .map((s) => ({role: s.role, goal: s.goalCount, filled: s.registrations.length}))
                .filter((s) => s.filled < s.goal),
        }))
        .filter((ev) => ev.openSlots.length > 0)
        .slice(0, 6);

    // Quick changenote (static for now)
    const changenote = {
        title: "Mise à jour du 12 janvier 2026",
        body: `Améliorations de l'interface mobile et corrections mineures. Merci pour vos retours !`,
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Événements inscrits</CardTitle>
                        <CardDescription>Prochains événements pour lesquels vous êtes inscrit·e</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {registeredEvents.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Pas d'événements à venir.</p>
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {registeredEvents.map((ev) => (
                                    <li key={ev.id} className="flex items-start justify-between">
                                        <div>
                                            <div className="font-medium">{ev.title}</div>
                                            <div className="text-sm text-muted-foreground">{format(new Date(ev.start), 'dd/MM/yyyy HH:mm')}</div>
                                        </div>
                                        <Link href={`/app/planning?event=${ev.id}`} className="text-sm text-primary">Voir</Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                    <CardFooter/>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Ticket assigné</CardTitle>
                        <CardDescription>Si une demande vous est assignée, elle apparaît ici</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {assignedTicket ? (
                            <div className="flex flex-col gap-2">
                                <div className="font-medium">Ticket #{assignedTicket.id}</div>
                                <div className="text-sm text-muted-foreground">Statut: {assignedTicket.statusName}</div>
                                <div className="text-sm text-muted-foreground">Source: {assignedTicket.source}</div>
                                <div className="pt-2">
                                    <Link href={`/app/ticket/${assignedTicket.id}`} className="text-sm text-primary">Ouvrir le ticket</Link>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Aucun ticket actif assigné.</p>
                        )}
                    </CardContent>
                    <CardFooter/>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Besoins en bénévoles</CardTitle>
                        <CardDescription>Événements proches ayant encore des places à pourvoir</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {eventsNeedingVolunteers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucun besoin immédiat détecté.</p>
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {eventsNeedingVolunteers.map((ev) => (
                                    <li key={ev.id} className="flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <div className="font-medium">{ev.title}</div>
                                            <div className="text-sm text-muted-foreground">{format(new Date(ev.start), 'dd/MM/yyyy HH:mm')}</div>
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {ev.openSlots.map((s: any) => `${s.role} — ${s.filled}/${s.goal}`).join(' · ')}
                                        </div>
                                        <div className="mt-2">
                                            <Link href={`/app/recruitments?event=${ev.id}`} className="text-sm text-primary">S'inscrire</Link>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                    <CardFooter/>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Note des développeurs</CardTitle>
                        <CardDescription>Dernières informations importantes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">
                            <div className="font-medium">{changenote.title}</div>
                            <div className="text-muted-foreground mt-1">{changenote.body}</div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Link href="/app/admin/history" className="text-sm text-primary">Voir toutes les notes</Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}