"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {Loader2, Mic, MicOff, Phone, PhoneOff} from "lucide-react";
import {type VoiceParticipant, VoiceSession, type VoiceStatus} from "@/lib/voice/session";
import {cn} from "@/lib/utils";

type Token = {channelId: string; exp: number; t: string};

/**
 * The visitor's side of a voice ticket, shared by the website chat and the public voice page.
 * One to one: the visitor only ever sees "Bénévole Écoutant", and audio goes through the
 * association's server (nobody sees anyone's address).
 */
export function VisitorCall({getToken, compact = false}: {
    /** Returns a fresh voice token for this ticket. */
    getToken: () => Promise<Token>;
    /** Smaller layout, inside the chat widget. */
    compact?: boolean;
}) {
    const sessionRef = useRef<VoiceSession | null>(null);
    const [status, setStatus] = useState<VoiceStatus>("idle");
    const [error, setError] = useState<string | null>(null);
    const [peers, setPeers] = useState<VoiceParticipant[]>([]);
    const [muted, setMuted] = useState(false);

    const volunteer = peers.find(p => !p.self);

    const join = useCallback(async () => {
        setError(null);
        setStatus("connecting");
        let token: Token;
        try {
            token = await getToken();
        } catch {
            setStatus("error");
            setError("L'appel n'est plus disponible.");
            return;
        }
        const session = new VoiceSession({type: "ticket", channelId: token.channelId}, {voiceToken: token}, {
            onStatus: (s, e) => {
                if (sessionRef.current !== session) return;
                setStatus(s);
                if (e) setError(e);
                if (s === "ended" || s === "error") sessionRef.current = null;
            },
            onParticipants: (list) => sessionRef.current === session && setPeers(list),
        });
        sessionRef.current = session;
        setMuted(false);
        await session.start();
    }, [getToken]);

    const hangUp = useCallback(() => {
        sessionRef.current?.leave();
        sessionRef.current = null;
        setPeers([]);
        setStatus("ended");
    }, []);

    const toggleMute = useCallback(() => {
        const s = sessionRef.current;
        if (!s) return;
        setMuted(!s.muted);
        void s.setMuted(!s.muted);
    }, []);

    useEffect(() => () => sessionRef.current?.leave(), []);

    const inCall = status === "connected" || status === "reconnecting";

    return (
        <section
            aria-label="Appel vocal"
            className={cn(
                "rounded-2xl border border-primary/25 bg-primary/[0.07] text-foreground",
                compact ? "p-3" : "p-6",
            )}
        >
            <div className={cn("flex items-center", compact ? "gap-3" : "gap-5")}>
                {/* The volunteer's marker: breathes while they speak */}
                <div className="relative shrink-0" aria-hidden="true">
                    <span className={cn(
                        "absolute inset-0 rounded-full bg-primary/30",
                        inCall && volunteer?.speaking ? "animate-[voice-breathe_1.6s_ease-in-out_infinite] motion-reduce:animate-none" : "scale-100 opacity-0",
                    )}/>
                    <span className={cn(
                        "relative flex items-center justify-center rounded-full bg-primary text-primary-foreground",
                        compact ? "size-10" : "size-14",
                    )}>
                        {status === "connecting" ? <Loader2 className="size-5 animate-spin"/> : <Phone className="size-5"/>}
                    </span>
                </div>

                <div className="min-w-0 flex-1" aria-live="polite">
                    <p className={cn("font-semibold", compact ? "text-sm" : "text-lg")}>
                        {status === "idle" && "Le bénévole vous propose de continuer à l'oral"}
                        {status === "connecting" && "Connexion à l'appel…"}
                        {inCall && !volunteer && "Vous êtes dans l'appel, le bénévole arrive"}
                        {inCall && volunteer && (status === "reconnecting" ? "Connexion instable, reconnexion…" : "Vous êtes en appel avec un bénévole")}
                        {status === "ended" && "Vous avez quitté l'appel"}
                        {status === "error" && "L'appel n'a pas pu démarrer"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {status === "idle" && "Votre micro sera demandé. Personne ne voit votre adresse ni votre numéro."}
                        {status === "connecting" && "Autorisez l'accès au micro si votre navigateur le demande."}
                        {inCall && (muted ? "Votre micro est coupé." : "Vous pouvez couper votre micro à tout moment.")}
                        {status === "ended" && "Vous pouvez revenir dans l'appel tant que l'écoute est en cours."}
                        {status === "error" && error}
                    </p>
                </div>
            </div>

            <div className={cn("flex flex-wrap gap-2", compact ? "mt-3" : "mt-5")}>
                {(status === "idle" || status === "ended" || status === "error") && (
                    <button
                        onClick={join}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                        <Phone className="size-4" aria-hidden="true"/>
                        {status === "idle" ? "Rejoindre l'appel" : "Revenir dans l'appel"}
                    </button>
                )}
                {(inCall || status === "connecting") && (
                    <>
                        <button
                            onClick={toggleMute}
                            disabled={!inCall}
                            className="inline-flex items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            {muted ? <MicOff className="size-4 text-red-600" aria-hidden="true"/> : <Mic className="size-4" aria-hidden="true"/>}
                            {muted ? "Réactiver le micro" : "Couper le micro"}
                        </button>
                        <button
                            onClick={hangUp}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                        >
                            <PhoneOff className="size-4" aria-hidden="true"/> Raccrocher
                        </button>
                    </>
                )}
            </div>
        </section>
    );
}
