"use client";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {CircleCheck, Ear, Loader2, LogIn, LogOut, NotebookPen, Users, X} from "lucide-react";
import {toast} from "sonner";
import {Badge, Button, Popover, PopoverContent, PopoverTrigger} from "@/components/ui";
import {apiFetch} from "@/lib/api";
import {useSocket} from "@/context/Socket";

/**
 * "Rejoindre la permanence": volunteers say they are on duty when they arrive, registered on
 * the planning or as reinforcements. Only present volunteers can be assigned écoutes, one at a
 * time. Managers see the team: who is free, who is in an écoute, who has not arrived yet.
 */

type Present = {
    id: string;
    name: string;
    registered: boolean;
    joinedAt: string;
    status: "available" | "in_ticket";
    ticket: { channelId: string; reference: string } | null;
    transmissionsDue: number;
};

type PresenceState = {
    permanence: { id: string; title: string; start: string; end: string } | null;
    me: { present: boolean; canJoin: boolean; registered: boolean };
    team: { present: Present[]; expected: { id: string; name: string }[] } | null;
};

const time = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"});

export function PermanencePresence() {
    const {socket} = useSocket();
    const [state, setState] = useState<PresenceState | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => apiFetch("/v1/permanence/presence").then(setState, () => undefined), []);

    useEffect(() => {
        const first = setTimeout(load, 0);
        // The permanence may start or end while the page is open
        const timer = setInterval(load, 60_000);
        if (!socket) return () => {
            clearTimeout(first);
            clearInterval(timer);
        };
        // Arrivals, departures, and écoutes starting or ending change the team's state
        socket.on("presenceUpdate", load);
        socket.on("updateRequest", load);
        return () => {
            clearTimeout(first);
            clearInterval(timer);
            socket.off("presenceUpdate", load);
            socket.off("updateRequest", load);
        };
    }, [socket, load]);

    const leave = async (userId?: string) => {
        setBusy(true);
        try {
            await apiFetch("/v1/permanence/leave", {method: "POST", body: JSON.stringify(userId ? {userId} : {})});
            await load();
        } catch (e) {
            toast.error((e as Error).message === "in_ticket"
                ? "Impossible pendant une écoute : fermez-la ou faites-la réattribuer d'abord."
                : "La présence n'a pas pu être mise à jour");
        } finally {
            setBusy(false);
        }
    };

    const join = async () => {
        setBusy(true);
        try {
            await apiFetch("/v1/permanence/join", {method: "POST"});
            toast.success(state?.me.registered ? "Vous êtes présent·e à la permanence" : "Vous rejoignez la permanence en renfort");
            await load();
        } catch {
            toast.error("Impossible de rejoindre la permanence");
        } finally {
            setBusy(false);
        }
    };

    if (!state?.permanence) return null;
    const {me, team} = state;

    return (
        <div className="flex items-center gap-2">
            {team && <TeamPopover team={team} busy={busy} onRemove={(id) => leave(id)}/>}
            {me.canJoin && (me.present ? (
                <Button variant="outline" onClick={() => leave()} disabled={busy}
                        title="Vous ne recevrez plus d'écoutes">
                    {busy ? <Loader2 className="animate-spin"/> : <LogOut/>} Quitter la permanence
                </Button>
            ) : (
                <Button onClick={join} disabled={busy}
                        title={me.registered ? "Indiquer que vous êtes là, pour recevoir des écoutes" : "Vous n'êtes pas inscrit·e : vous rejoignez en renfort"}>
                    {busy ? <Loader2 className="animate-spin"/> : <LogIn/>} {me.registered ? "Rejoindre la permanence" : "Rejoindre en renfort"}
                </Button>
            ))}
        </div>
    );
}

function TeamPopover({team, busy, onRemove}: {
    team: NonNullable<PresenceState["team"]>;
    busy: boolean;
    onRemove: (userId: string) => void;
}) {
    const free = team.present.filter(p => p.status === "available").length;
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" aria-label={`Équipe : ${team.present.length} présents, ${free} disponibles`}>
                    <Users/> {team.present.length} présent{team.present.length > 1 ? "s" : ""},
                    <span className="text-emerald-700 dark:text-emerald-400">{free} libre{free > 1 ? "s" : ""}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(380px,calc(100vw-2rem))] p-0">
                <div className="border-b px-4 py-3">
                    <p className="text-sm font-medium">Équipe de la permanence</p>
                    <p className="text-xs text-muted-foreground">Seuls les bénévoles présents et libres peuvent recevoir une écoute.</p>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {team.present.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-muted-foreground">Personne n&apos;a encore rejoint la permanence.</p>
                    ) : (
                        <ul className="divide-y">
                            {team.present.map(p => (
                                <li key={p.id} className="flex items-start gap-3 px-4 py-2.5">
                                    {p.status === "available"
                                        ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden/>
                                        : <Ear className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden/>}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span className="truncate text-sm font-medium">{p.name}</span>
                                            {!p.registered && <Badge variant="outline" className="text-[11px]">Renfort</Badge>}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {p.status === "available" ? "Disponible" : (
                                                <>En écoute{" "}
                                                    {p.ticket && (
                                                        <Link href={`/app/ticket/${p.ticket.channelId}`} className="underline underline-offset-2">
                                                            {p.ticket.reference}
                                                        </Link>
                                                    )}</>
                                            )}
                                            {" "}depuis {time(p.joinedAt)}
                                        </p>
                                        {p.transmissionsDue > 0 && (
                                            <p className="flex items-center gap-1 text-xs text-sky-700 dark:text-sky-400">
                                                <NotebookPen className="size-3" aria-hidden/>
                                                {p.transmissionsDue} transmission{p.transmissionsDue > 1 ? "s" : ""} à rédiger
                                            </p>
                                        )}
                                    </div>
                                    {p.status === "available" && (
                                        <Button variant="ghost" size="icon" className="size-7 shrink-0" disabled={busy}
                                                aria-label={`Retirer ${p.name} de la permanence`} title="Retirer de la permanence"
                                                onClick={() => onRemove(p.id)}>
                                            <X className="size-4"/>
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {team.expected.length > 0 && (
                        <div className="border-t px-4 py-3">
                            <p className="mb-1 text-xs font-medium text-muted-foreground">Inscrits pas encore arrivés</p>
                            <p className="text-sm">{team.expected.map(u => u.name).join(", ")}</p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
