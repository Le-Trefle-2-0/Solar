"use client";

import {useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";
import {useSocket} from "@/context/Socket";

export type VoiceRoomState =
    | {type: "permanence"; channelId: string; participants: {peerId: string; name: string; muted: boolean}[]}
    | {type: "ticket"; channelId: string; volunteer: boolean; visitor: boolean};

/**
 * Live state of voice rooms, keyed by channel id: who is in a permanence's voice channel, and
 * whether a ticket call is going on (supervisors and the assigned volunteer see ticket calls).
 * Loaded once from the API, then kept current by the WebSocket service's "voiceState" events.
 */
export function useVoiceStatus() {
    const {socket} = useSocket();
    const [rooms, setRooms] = useState<Record<string, VoiceRoomState>>({});
    const [available, setAvailable] = useState(true);

    useEffect(() => {
        let cancelled = false;
        apiFetch("/v1/voice/status")
            .then((res: {available: boolean; rooms: VoiceRoomState[]}) => {
                if (cancelled) return;
                setAvailable(res.available);
                setRooms(Object.fromEntries(res.rooms.map(r => [r.channelId, r])));
            })
            .catch(() => !cancelled && setAvailable(false));
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!socket) return;
        const onState = (state: VoiceRoomState) => {
            if (!state?.channelId) return;
            setRooms(prev => ({...prev, [state.channelId]: state}));
        };
        socket.on("voiceState", onState);
        return () => {
            socket.off("voiceState", onState);
        };
    }, [socket]);

    return {rooms, available};
}

/** A ticket call is going on (someone is in the room). */
export const isTicketCallLive = (s: VoiceRoomState | undefined) =>
    s?.type === "ticket" && (s.volunteer || s.visitor);
