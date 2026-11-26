'use client';
import React, {createContext, useContext, useEffect, useMemo, useRef, useState} from "react";
import Peer, {type MediaConnection} from "peerjs";
import {toast} from "sonner";
import {apiFetch} from "@/lib/api";

interface PeerContextProps {
    peerInstance: Peer | null;
    callColor: string;
    isMuted: boolean;
    connectedUsers: string[];
    netQuality: number; // 0=idle/unknown, 1=red, 2=orange, 3=green
    rttMs: number | null;
    lossPct: number | null;
    /** Link to give the visitor for the current call (signed, expires after 30 min). */
    callLink: string | null;
    startCall: (
        myAudioRef: React.RefObject<HTMLAudioElement | null>,
        remoteAudioRef: React.RefObject<HTMLAudioElement | null>,
        channelId: string,
    ) => Promise<void>;
    stopCall: () => void;
    toggleMute: () => void;
}

const PeerContext = createContext<PeerContextProps>({
    peerInstance: null,
    callColor: "#000",
    isMuted: false,
    connectedUsers: [],
    netQuality: 0,
    rttMs: null,
    lossPct: null,
    callLink: null,
    startCall: async () => {
    },
    stopCall: () => {
    },
    toggleMute: () => {
    }
});

export const usePeer = () => useContext(PeerContext);

const peerOptions = () => ({
    host: process.env.NEXT_PUBLIC_HOST,
    port: 9000,
    path: '/',
    secure: true,
});

export const PeerProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [peerInstance, setPeerInstance] = useState<Peer | null>(null);
    const [callColor, setCallColor] = useState("#000");
    const [isMuted, setIsMuted] = useState(false);
    const [callLink, setCallLink] = useState<string | null>(null);
    const [connectedPeerIds, setConnectedPeerIds] = useState<string[]>([]);
    const [peerNames, setPeerNames] = useState<Record<string, string>>({});
    const [mediaCall, setMediaCall] = useState<MediaConnection | null>(null);
    const [netQuality, setNetQuality] = useState<number>(0);
    const [rttMs, setRttMs] = useState<number | null>(null);
    const [lossPct, setLossPct] = useState<number | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const activeCallRef = useRef<MediaConnection | null>(null);

    const startCall = async (
        myAudioRef: React.RefObject<HTMLAudioElement | null>,
        remoteAudioRef: React.RefObject<HTMLAudioElement | null>,
        channelId: string,
    ) => {
        if (peerInstance) return;

        // The API checks launch_voice and access to the ticket, and signs the call (#241)
        let call: {callId: string; token: string; url: string};
        try {
            call = await apiFetch('/v1/calls', {method: 'POST', body: JSON.stringify({channelId})});
        } catch (e: any) {
            toast.error(e?.message || "Impossible de démarrer l'appel");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({video: false, audio: true});
            localStreamRef.current = stream;
            if (myAudioRef.current) {
                myAudioRef.current.srcObject = stream;
                myAudioRef.current.muted = true;
                myAudioRef.current.play?.().catch(() => {
                });
            }

            const peer = new Peer(call.callId, peerOptions());
            setPeerInstance(peer);
            setCallLink(call.url);
            setCallColor("#e0c43a"); // connecting/awaiting call

            peer.on('call', incoming => {
                const md: any = incoming.metadata;
                // Only the visitor holding this call's signed link, and one caller at a time
                if (md?.token !== call.token || activeCallRef.current) {
                    incoming.close();
                    return;
                }
                const answer = () => {
                    activeCallRef.current = incoming;
                    incoming.answer(stream);
                    setMediaCall(incoming);
                    setCallColor("#5de03a"); // connected
                    const remoteId = incoming.peer;
                    setPeerNames(prev => ({...prev, [remoteId]: 'utilisateur'}));
                    setConnectedPeerIds(prev => Array.from(new Set([...prev, remoteId])));

                    incoming.on('stream', remoteStream => {
                        if (remoteAudioRef.current) {
                            remoteAudioRef.current.srcObject = remoteStream;
                            remoteAudioRef.current.play?.().catch(() => {
                            });
                        }
                    });
                    incoming.on('close', () => {
                        activeCallRef.current = null;
                        setCallColor('#e0c43a');
                        setMediaCall(null);
                        setConnectedPeerIds(prev => prev.filter(id => id !== remoteId));
                        setPeerNames(prev => {
                            const {[remoteId]: _, ...rest} = prev;
                            return rest;
                        });
                    });
                    incoming.on('error', () => setCallColor('#e03a3a'));
                };
                // Nothing is answered without an explicit choice
                toast("Un visiteur demande à rejoindre l'appel", {
                    duration: 30_000,
                    action: {label: "Accepter", onClick: answer},
                    cancel: {label: "Refuser", onClick: () => incoming.close()},
                });
            });

            peer.on('disconnected', () => setCallColor('#e03a3a'));
            peer.on('error', () => setCallColor('#e03a3a'));
            peer.on('close', () => setCallColor('#000'));
        } catch (error) {
            console.error("Error accessing media devices:", error);
            toast.error("Merci d'autoriser l'accès au micro.");
        }
    };

    const stopCall = () => {
        try {
            localStreamRef.current?.getTracks().forEach(t => t.stop());
        } catch {
        }
        localStreamRef.current = null;
        setIsMuted(false);
        try {
            mediaCall?.close();
        } catch {
        }
        activeCallRef.current = null;
        setMediaCall(null);
        try {
            peerInstance?.destroy();
        } catch {
        }
        setPeerInstance(null);
        setCallLink(null);
        setConnectedPeerIds([]);
        setPeerNames({});
        setNetQuality(0);
        setRttMs(null);
        setLossPct(null);
        setCallColor("#000");
    };

    const toggleMute = () => {
        const s = localStreamRef.current;
        if (!s) return;
        const audioTracks = s.getAudioTracks();
        if (audioTracks.length > 0) {
            const current = audioTracks[0].enabled;
            audioTracks[0].enabled = !current;
            setIsMuted(current);
        }
    };

    // Server round-trip as a connection indicator. Discovery (/peers) is disabled on the
    // PeerJS server (#226); /peerjs/id answers without revealing anyone.
    useEffect(() => {
        if (!peerInstance) {
            setNetQuality(0);
            setRttMs(null);
            setLossPct(null);
            return;
        }
        let mounted = true;
        const host = process.env.NEXT_PUBLIC_HOST;
        const windowSize = 10;
        const results: { ok: boolean; rtt: number | null }[] = [];

        const ping = async () => {
            const start = performance.now();
            let ok = false;
            let rtt: number | null = null;
            try {
                const res = await fetch(`https://${host}:9000/peerjs/id`, {cache: 'no-store'});
                ok = res.ok;
                rtt = ok ? Math.round(performance.now() - start) : null;
            } catch {
                ok = false;
            }
            if (!mounted) return;
            results.push({ok, rtt});
            while (results.length > windowSize) results.shift();
            const failures = results.filter(r => !r.ok || r.rtt == null).length;
            const failurePct = +(100 * failures / results.length).toFixed(2);
            const lastRtt = [...results].reverse().find(r => r.rtt != null)?.rtt ?? null;
            setRttMs(lastRtt);
            setLossPct(failurePct);

            let q = 0;
            if (lastRtt != null) {
                if (failurePct >= 10) q = 1;
                else if (lastRtt < 150 && failurePct < 1) q = 3;
                else if (lastRtt < 400 && failurePct < 5) q = 2;
                else q = 1;
            } else if (failurePct > 0) {
                q = 1;
            }
            setNetQuality(q);
        };

        const id = setInterval(ping, 2000);
        ping();
        return () => {
            mounted = false;
            clearInterval(id);
        };
    }, [peerInstance]);

    const connectedUsers = useMemo(
        () => connectedPeerIds.map(id => peerNames[id] || 'utilisateur'),
        [connectedPeerIds, peerNames],
    );

    return (
        <PeerContext.Provider value={{
            peerInstance,
            callColor,
            isMuted,
            connectedUsers,
            netQuality,
            rttMs,
            lossPct,
            callLink,
            startCall,
            stopCall,
            toggleMute
        }}>
            {children}
        </PeerContext.Provider>
    );
};
