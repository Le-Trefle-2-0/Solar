"use client";

import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from "react";
import {toast} from "sonner";
import {getJwt} from "@/lib/api";
import {type VoiceParticipant, type VoiceRoomType, VoiceSession, type VoiceStatus} from "@/lib/voice/session";

/**
 * Volunteer voice connection, kept while navigating the app (#78). One room at a time:
 * the permanence's voice channel or a one-to-one voice ticket.
 */

export interface ActiveVoiceRoom {
    type: VoiceRoomType;
    channelId: string;
    /** Shown in the sidebar, e.g. "Vocal de la permanence" or "Ticket-00042". */
    label: string;
}

interface VoiceContextValue {
    room: ActiveVoiceRoom | null;
    status: VoiceStatus;
    participants: VoiceParticipant[];
    muted: boolean;
    join: (room: ActiveVoiceRoom) => Promise<void>;
    leave: () => void;
    toggleMute: () => void;
}

const VoiceContext = createContext<VoiceContextValue>({
    room: null,
    status: "idle",
    participants: [],
    muted: false,
    join: async () => undefined,
    leave: () => undefined,
    toggleMute: () => undefined,
});

export const useVoice = () => useContext(VoiceContext);

export function VoiceProvider({children}: {children: React.ReactNode}) {
    const sessionRef = useRef<VoiceSession | null>(null);
    const [room, setRoom] = useState<ActiveVoiceRoom | null>(null);
    const [status, setStatus] = useState<VoiceStatus>("idle");
    const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
    const [muted, setMuted] = useState(false);

    const leave = useCallback(() => {
        sessionRef.current?.leave();
        sessionRef.current = null;
        setRoom(null);
        setParticipants([]);
        setMuted(false);
        setStatus("idle");
    }, []);

    const join = useCallback(async (next: ActiveVoiceRoom) => {
        if (sessionRef.current) leave();
        const jwt = await getJwt();
        if (!jwt) {
            toast.error("Session expirée, reconnectez-vous.");
            return;
        }
        setRoom(next);
        setMuted(false);
        const session = new VoiceSession({type: next.type, channelId: next.channelId}, {jwt}, {
            onStatus: (s, error) => {
                if (sessionRef.current !== session) return;
                setStatus(s);
                if (s === "error" || s === "ended") {
                    if (error) (s === "error" ? toast.error : toast)(error);
                    sessionRef.current = null;
                    setRoom(null);
                    setParticipants([]);
                }
            },
            onParticipants: (list) => {
                if (sessionRef.current === session) setParticipants(list);
            },
        });
        sessionRef.current = session;
        await session.start();
    }, [leave]);

    const toggleMute = useCallback(() => {
        const s = sessionRef.current;
        if (!s) return;
        const next = !s.muted;
        setMuted(next);
        void s.setMuted(next);
    }, []);

    // Leave cleanly when the tab closes
    useEffect(() => {
        const onUnload = () => sessionRef.current?.leave();
        window.addEventListener("beforeunload", onUnload);
        return () => window.removeEventListener("beforeunload", onUnload);
    }, []);

    return (
        <VoiceContext.Provider value={{room, status, participants, muted, join, leave, toggleMute}}>
            {children}
        </VoiceContext.Provider>
    );
}
