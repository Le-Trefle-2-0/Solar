"use client";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Check, Eye, EyeOff, GraduationCap, Loader2, X} from "lucide-react";
import {toast} from "sonner";
import {
    Badge,
    Button,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui";
import {apiFetch} from "@/lib/api";
import {useSocket} from "@/context/Socket";

/**
 * "Observer une écoute": volunteers in training ask from the permanence's channel; a manager
 * approves by choosing an écoute in progress, which the trainee then follows read-only until it
 * ends, or refuses. Both appear in the écoute's transcript as team notes.
 */

export type SpectateRequest = {
    id: string;
    status: "pending" | "approved";
    user: { id: string; name: string };
    createdAt: string;
    ticket: { channelId: string; reference: string } | null;
};

type OngoingTicket = { id: number; reference: string; channelId: string; volunteer: string | null; observers: number };

export type SpectateState = {
    permanence: { id: string; channelId: string } | null;
    me: { canRequest: boolean; request: SpectateRequest | null };
    manage: { requests: SpectateRequest[]; tickets: OngoingTicket[] } | null;
};

const ERRORS: Record<string, string> = {
    no_permanence: "Aucune permanence n'est en cours.",
    wrong_channel: "La demande se fait depuis le salon de la permanence en cours.",
    already_requested: "Vous avez déjà une demande en cours.",
    not_pending: "Cette demande a déjà été traitée.",
    not_allowed: "Ce bénévole ne peut plus observer d'écoute.",
    ticket_not_ongoing: "Cette écoute n'est plus en cours.",
    own_ticket: "Ce bénévole est attribué à cette écoute.",
};
const errorMessage = (e: unknown, fallback: string) => ERRORS[(e as Error)?.message] ?? fallback;

const time = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"});

/** The observation state, kept up to date by the WebSocket events. */
export function useSpectate() {
    const {socket} = useSocket();
    const [state, setState] = useState<SpectateState | null>(null);
    const load = useCallback(() => apiFetch("/v1/permanence/spectate").then(setState, () => undefined), []);

    useEffect(() => {
        const first = setTimeout(load, 0);
        // The permanence may start or end while the page is open
        const timer = setInterval(load, 60_000);
        if (!socket) return () => {
            clearTimeout(first);
            clearInterval(timer);
        };
        // Requests, decisions, and écoutes starting or ending
        socket.on("spectateUpdate", load);
        socket.on("updateRequest", load);
        return () => {
            clearTimeout(first);
            clearInterval(timer);
            socket.off("spectateUpdate", load);
            socket.off("updateRequest", load);
        };
    }, [socket, load]);

    return {state, reload: load};
}

async function act(url: string, body: unknown, success: string, fallback: string, reload: () => Promise<unknown>) {
    try {
        await apiFetch(url, {method: "POST", body: JSON.stringify(body)});
        toast.success(success);
        return true;
    } catch (e) {
        toast.error(errorMessage(e, fallback));
        return false;
    } finally {
        await reload();
    }
}

/** In the permanence's channel: the trainee's request, or the managers' decisions. */
export function SpectatePanel({channelId, state, reload}: {
    channelId: string;
    state: SpectateState | null;
    reload: () => Promise<unknown>;
}) {
    const [busy, setBusy] = useState(false);

    // Only in the channel of the permanence on now
    if (!state?.permanence || state.permanence.channelId !== channelId) return null;
    const {me, manage} = state;

    const run = async (url: string, body: unknown, success: string, fallback: string) => {
        setBusy(true);
        await act(url, body, success, fallback, reload);
        setBusy(false);
    };

    return (
        <div className="flex items-center gap-2">
            {manage && <ManagePopover manage={manage} busy={busy} run={run}/>}
            {me.canRequest && !manage && (() => {
                const request = me.request;
                if (!request) return (
                    <Button onClick={() => run("/v1/permanence/spectate", {channelId}, "Demande envoyée aux responsables", "La demande n'a pas pu être envoyée")}
                            disabled={busy} title="Un responsable choisira une écoute en cours, que vous suivrez en lecture seule">
                        {busy ? <Loader2 className="animate-spin"/> : <Eye/>} Demander à observer une écoute
                    </Button>
                );
                if (request.status === "pending") return (
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-9 gap-1.5 px-3 text-sm font-normal">
                            <Loader2 className="size-3.5 animate-spin" aria-hidden/> En attente d&apos;un responsable
                        </Badge>
                        <Button variant="outline" disabled={busy}
                                onClick={() => run(`/v1/permanence/spectate/${request.id}/end`, {}, "Demande annulée", "La demande n'a pas pu être annulée")}>
                            Annuler
                        </Button>
                    </div>
                );
                return request.ticket && (
                    <Button asChild>
                        <Link href={`/app/ticket/${request.ticket.channelId}`}>
                            <Eye/> Observer l&apos;écoute {request.ticket.reference}
                        </Link>
                    </Button>
                );
            })()}
        </div>
    );
}

function ManagePopover({manage, busy, run}: {
    manage: NonNullable<SpectateState["manage"]>;
    busy: boolean;
    run: (url: string, body: unknown, success: string, fallback: string) => Promise<void>;
}) {
    const pending = manage.requests.filter(r => r.status === "pending");
    const observing = manage.requests.filter(r => r.status === "approved");
    // Nothing to decide nor to follow: no button
    if (pending.length === 0 && observing.length === 0) return null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant={pending.length ? "default" : "outline"}
                        aria-label={`Observations : ${pending.length} demande(s) en attente, ${observing.length} en cours`}>
                    <GraduationCap/>
                    {pending.length > 0
                        ? `${pending.length} demande${pending.length > 1 ? "s" : ""} d'observation`
                        : `${observing.length} observation${observing.length > 1 ? "s" : ""}`}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(400px,calc(100vw-2rem))] p-0">
                <div className="border-b px-4 py-3">
                    <p className="text-sm font-medium">Bénévoles en formation</p>
                    <p className="text-xs text-muted-foreground">
                        Choisissez l&apos;écoute à observer : le bénévole en formation la suivra en lecture seule jusqu&apos;à sa fin.
                    </p>
                </div>
                <div className="max-h-[60vh] divide-y overflow-y-auto">
                    {pending.map(r => (
                        <PendingRequest key={r.id} request={r} tickets={manage.tickets} busy={busy} run={run}/>
                    ))}
                    {observing.length > 0 && (
                        <div className="px-4 py-3">
                            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Observations en cours</p>
                            <ul className="space-y-1.5">
                                {observing.map(r => (
                                    <li key={r.id} className="flex items-center gap-2 text-sm">
                                        <Eye className="size-4 shrink-0 text-muted-foreground" aria-hidden/>
                                        <span className="min-w-0 flex-1 truncate">
                                            {r.user.name}
                                            {r.ticket && <> · <Link href={`/app/ticket/${r.ticket.channelId}`} className="underline underline-offset-2">écoute {r.ticket.reference}</Link></>}
                                        </span>
                                        <Button variant="ghost" size="sm" disabled={busy}
                                                onClick={() => run(`/v1/permanence/spectate/${r.id}/end`, {}, "Observation arrêtée", "L'observation n'a pas pu être arrêtée")}>
                                            Arrêter
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function PendingRequest({request, tickets, busy, run}: {
    request: SpectateRequest;
    tickets: OngoingTicket[];
    busy: boolean;
    run: (url: string, body: unknown, success: string, fallback: string) => Promise<void>;
}) {
    const [ticketId, setTicketId] = useState<string>("");
    return (
        <div className="space-y-2 px-4 py-3">
            <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium">{request.user.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">demandé à {time(request.createdAt)}</span>
            </div>
            {tickets.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucune écoute en cours pour le moment : la demande reste en attente.</p>
            ) : (
                <Select value={ticketId} onValueChange={setTicketId}>
                    <SelectTrigger className="w-full" aria-label={`Écoute à observer pour ${request.user.name}`}>
                        <SelectValue placeholder="Choisir une écoute en cours"/>
                    </SelectTrigger>
                    <SelectContent>
                        {tickets.map(t => (
                            <SelectItem key={t.id} value={String(t.id)}>
                                Écoute {t.reference}{t.volunteer ? ` avec ${t.volunteer}` : ""}
                                {t.observers > 0 ? ` (${t.observers} observateur${t.observers > 1 ? "s" : ""})` : ""}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" disabled={busy}
                        onClick={() => run(`/v1/permanence/spectate/${request.id}/refuse`, {}, "Demande refusée", "La demande n'a pas pu être refusée")}>
                    <X/> Refuser
                </Button>
                <Button size="sm" disabled={busy || !ticketId}
                        onClick={() => run(`/v1/permanence/spectate/${request.id}/approve`, {ticketId: Number(ticketId)},
                            `${request.user.name} observe l'écoute`, "La demande n'a pas pu être validée")}>
                    <Check/> Valider
                </Button>
            </div>
        </div>
    );
}

/** In an observed écoute: says it is read-only, and lets the trainee stop. */
export function ObservationBar({request, onEnded}: { request: SpectateRequest; onEnded: () => Promise<unknown> }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    return (
        <div className="flex items-center gap-2">
            <Badge variant="secondary" className="h-9 gap-1.5 px-3 text-sm font-normal">
                <Eye className="size-4" aria-hidden/> Observation, lecture seule
            </Badge>
            <Button variant="outline" disabled={busy} onClick={async () => {
                setBusy(true);
                const ok = await act(`/v1/permanence/spectate/${request.id}/end`, {}, "Vous n'observez plus cette écoute",
                    "L'observation n'a pas pu être arrêtée", onEnded);
                setBusy(false);
                if (ok) router.push("/app/chat");
            }}>
                {busy ? <Loader2 className="animate-spin"/> : <EyeOff/>} Arrêter d&apos;observer
            </Button>
        </div>
    );
}
