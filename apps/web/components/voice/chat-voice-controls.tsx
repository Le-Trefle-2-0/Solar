"use client";

import {useEffect, useState} from "react";
import {Copy, Headphones, Loader2, Phone, PhoneCall, PhoneOff, PhoneMissed} from "lucide-react";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {apiFetch} from "@/lib/api";
import {useVoice} from "@/context/Voice";
import {useSocket} from "@/context/Socket";
import {usePermissions} from "@/hooks/use-permissions";
import {useVoiceStatus} from "@/hooks/use-voice-status";
import {cn} from "@/lib/utils";

/** Permanence voice channel: open to every volunteer, like a Discord voice channel. */
export function PermanenceVoiceControls({channelId}: {channelId: string}) {
    const {room, status, join, leave} = useVoice();
    const {rooms, available} = useVoiceStatus();
    const state = rooms[channelId];
    const inThisRoom = room?.type === "permanence" && room.channelId === channelId;
    const people = state?.type === "permanence" ? state.participants : [];

    return (
        <div className="flex items-center gap-2">
            {people.length > 0 && (
                <span className="hidden h-9 items-center rounded-md border bg-background px-3 text-sm text-muted-foreground md:inline-flex"
                      title={people.map(p => p.name).join(", ")}>
                    {people.length === 1 ? "1 personne" : `${people.length} personnes`} en vocal
                </span>
            )}
            {inThisRoom ? (
                <Button variant="outline" onClick={leave}>
                    <PhoneOff/> Quitter le vocal
                </Button>
            ) : (
                <Button
                    variant="outline"
                    disabled={!available || status === "connecting"}
                    title={available ? "Rejoindre le salon vocal de la permanence" : "Service vocal indisponible"}
                    onClick={() => join({type: "permanence", channelId, label: "Vocal de la permanence"})}
                >
                    {status === "connecting" ? <Loader2 className="animate-spin"/> : <Headphones/>} Rejoindre le vocal
                </Button>
            )}
        </div>
    );
}

interface TicketVoiceProps {
    channelId: string;
    /** 2 = in progress. */
    status: number;
    voice: boolean;
    assignedUserId: string | null | undefined;
    currentUserId: string | undefined;
    /** e.g. "Écoute 00042" */
    label: string;
}

/**
 * Voice écoute: the volunteer switches the écoute to voice (the person is then offered to join,
 * on the website or through the Discord bot), joins the one-to-one call, and can end it.
 * Supervisors see whether a call is going on.
 */
export function TicketVoiceControls({channelId, status, voice, assignedUserId, currentUserId, label}: TicketVoiceProps) {
    const {room, status: voiceStatus, join, leave} = useVoice();
    const {rooms, available} = useVoiceStatus();
    const {socket} = useSocket();
    const {can} = usePermissions();
    const [isVoice, setIsVoice] = useState(voice);
    const [link, setLink] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => setIsVoice(voice), [voice]);
    useEffect(() => {
        if (!socket) return;
        const onVoice = (d: {channelId?: string; voice?: boolean}) => {
            if (d?.channelId !== channelId) return;
            setIsVoice(d.voice !== false);
            if (d.voice === false) setLink(null);
        };
        socket.on("ticketVoice", onVoice);
        return () => {
            socket.off("ticketVoice", onVoice);
        };
    }, [socket, channelId]);

    const handles = currentUserId !== undefined && (assignedUserId === currentUserId || can("tickets.send_message_all"));
    const canCall = can("tickets.launch_voice") && handles;
    const call = rooms[channelId];
    const ticketCall = call?.type === "ticket" ? call : null;
    const inThisCall = room?.type === "ticket" && room.channelId === channelId;
    const otherVolunteerIn = !!ticketCall?.volunteer && !inThisCall;

    if (status !== 2 && !ticketCall?.volunteer && !ticketCall?.visitor) return null;

    const switchToVoice = async () => {
        setBusy(true);
        try {
            const res = await apiFetch("/v1/voice/tickets", {method: "POST", body: JSON.stringify({channelId})});
            setIsVoice(true);
            setLink(res.link ?? null);
            toast.success(res.source === "discord"
                ? "Écoute passée en vocal : le lien a été envoyé à la personne sur Discord."
                : "Écoute passée en vocal : la personne peut rejoindre l'appel depuis le chat du site.");
        } catch (e: any) {
            toast.error(e?.message || "Impossible de passer en vocal");
        } finally {
            setBusy(false);
        }
    };

    const endVoice = async () => {
        if (!confirm("Arrêter le vocal ? L'appel se termine pour vous et pour la personne ; l'écoute continue par écrit.")) return;
        setBusy(true);
        try {
            await apiFetch("/v1/voice/tickets/end", {method: "POST", body: JSON.stringify({channelId})});
            if (inThisCall) leave();
            setIsVoice(false);
            setLink(null);
            toast.success("Vocal arrêté : l'écoute continue par écrit.");
        } catch (e: any) {
            toast.error(e?.message || "Impossible d'arrêter le vocal");
        } finally {
            setBusy(false);
        }
    };

    const copyLink = async () => {
        if (!link) return;
        try {
            await navigator.clipboard.writeText(link);
            toast.success("Lien d'appel copié (valable 1 heure)");
        } catch {
            toast.error("Impossible de copier le lien");
        }
    };

    // Call state, in words, at the same height as the buttons
    const both = !!ticketCall?.volunteer && !!ticketCall?.visitor;
    const state = both ? {text: "Appel en cours", dot: "bg-emerald-500", tone: "border-emerald-600/40 text-emerald-800 dark:text-emerald-300"}
        : ticketCall?.volunteer ? {text: "En attente de la personne", dot: "bg-amber-500", tone: "border-amber-500/40 text-amber-800 dark:text-amber-300"}
            : ticketCall?.visitor ? {text: "La personne attend le bénévole", dot: "bg-amber-500 animate-pulse", tone: "border-amber-500/40 text-amber-800 dark:text-amber-300"}
                : {text: "Écoute vocale : personne en ligne", dot: "bg-muted-foreground/40", tone: "text-muted-foreground"};

    return (
        <div className="flex items-center gap-2">
            {isVoice && (
                <span role="status"
                      className={cn("inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium", state.tone)}>
                    <span className={cn("size-2 rounded-full", state.dot)} aria-hidden="true"/>
                    {state.text}
                </span>
            )}

            {canCall && status === 2 && !isVoice && (
                <Button variant="outline" onClick={switchToVoice} disabled={busy || !available}
                        title={available ? "Proposer un échange vocal à la personne" : "Service vocal indisponible"}>
                    {busy ? <Loader2 className="animate-spin"/> : <PhoneCall/>} Passer en vocal
                </Button>
            )}

            {canCall && isVoice && status === 2 && (inThisCall ? (
                <Button variant="outline" onClick={leave}>
                    <PhoneOff/> Quitter l&apos;appel
                </Button>
            ) : (
                <Button
                    variant="outline"
                    onClick={() => join({type: "ticket", channelId, label})}
                    disabled={!available || otherVolunteerIn || voiceStatus === "connecting"}
                    title={otherVolunteerIn ? "Un autre bénévole est déjà dans l'appel" : "Rejoindre l'appel"}
                >
                    {voiceStatus === "connecting" ? <Loader2 className="animate-spin"/> : <Phone/>} Rejoindre l&apos;appel
                </Button>
            ))}

            {canCall && isVoice && (
                <Button variant="outline" onClick={endVoice} disabled={busy}
                        className="text-red-600 hover:text-red-700"
                        title="Terminer l'appel pour vous et pour la personne ; l'écoute continue par écrit">
                    <PhoneMissed/> Arrêter le vocal
                </Button>
            )}

            {link && (
                <Button variant="ghost" size="icon" onClick={copyLink} title="Copier le lien envoyé sur Discord">
                    <Copy/>
                </Button>
            )}
        </div>
    );
}
