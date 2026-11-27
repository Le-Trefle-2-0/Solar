"use client";

import {Loader2, Mic, MicOff, PhoneOff, Radio} from "lucide-react";
import {useVoice} from "@/context/Voice";
import {cn} from "@/lib/utils";

/** Sidebar footer panel while connected to a voice room: room, participants, mute, leave. */
export function VoiceDock() {
    const {room, status, participants, muted, toggleMute, leave} = useVoice();
    if (!room) return <div className="h-12"/>;

    const connecting = status === "connecting" || status === "reconnecting";
    return (
        <div className="mb-2 rounded-lg border bg-sidebar-accent/40 p-2 text-xs">
            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    {connecting
                        ? <Loader2 className="size-4 shrink-0 animate-spin text-amber-500"/>
                        : <Radio className="size-4 shrink-0 text-emerald-600"/>}
                    <div className="min-w-0">
                        <div className={cn("font-medium", connecting ? "text-amber-600" : "text-emerald-700 dark:text-emerald-400")}>
                            {connecting ? (status === "reconnecting" ? "Reconnexion…" : "Connexion…") : "Vocal connecté"}
                        </div>
                        <div className="truncate text-muted-foreground">{room.label}</div>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <button
                        onClick={toggleMute}
                        className={cn("rounded-md p-1.5 transition-colors hover:bg-background", muted && "text-red-600")}
                        title={muted ? "Réactiver le micro" : "Couper le micro"}
                        aria-label={muted ? "Réactiver le micro" : "Couper le micro"}
                        aria-pressed={muted}
                    >
                        {muted ? <MicOff className="size-4"/> : <Mic className="size-4"/>}
                    </button>
                    <button
                        onClick={leave}
                        className="rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950"
                        title="Quitter le vocal"
                        aria-label="Quitter le vocal"
                    >
                        <PhoneOff className="size-4"/>
                    </button>
                </div>
            </div>
            {participants.length > 0 && (
                <ul className="mt-2 space-y-1 border-t pt-2" aria-label="Participants">
                    {participants.map(p => (
                        <li key={p.peerId} className="flex items-center gap-2">
                            <span className={cn(
                                "size-2 shrink-0 rounded-full",
                                p.speaking ? "bg-emerald-500 ring-2 ring-emerald-500/30" : "bg-muted-foreground/30",
                            )}/>
                            <span className={cn("truncate", p.self && "font-medium")}>{p.name}</span>
                            {p.muted && <MicOff className="ml-auto size-3 shrink-0 text-muted-foreground" aria-label="Micro coupé"/>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
