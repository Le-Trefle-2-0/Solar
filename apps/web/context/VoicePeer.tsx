'use client';
import React, {createContext, useContext, useEffect, useMemo, useRef, useState} from "react";
import Peer from "peerjs";

interface PeerContextProps {
    peerInstance: Peer | null;
    callColor: string;
    isMuted: boolean;
    connectedUsers: string[];
    netQuality: number; // 0=idle/unknown, 1=red, 2=orange, 3=green
    rttMs: number | null;
    lossPct: number | null;
    startCall: (
        myAudioRef: React.RefObject<HTMLAudioElement | null>,
        remoteAudioRef: React.RefObject<HTMLAudioElement | null>
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
    startCall: async () => {
    },
    stopCall: () => {
    },
    toggleMute: () => {
    }
});

export const usePeer = () => useContext(PeerContext);

export const PeerProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [peerInstance, setPeerInstance] = useState<Peer | null>(null);
    const [callColor, setCallColor] = useState("#000");
    const [isMuted, setIsMuted] = useState(false);
    const [myPeerId, setMyPeerId] = useState<string | null>(null);
    const [connectedPeerIds, setConnectedPeerIds] = useState<string[]>([]);
    const [peerNames, setPeerNames] = useState<Record<string, string>>({});
    const [mediaCall, setMediaCall] = useState<any | null>(null);
    const [netQuality, setNetQuality] = useState<number>(0);
    const [rttMs, setRttMs] = useState<number | null>(null);
    const [lossPct, setLossPct] = useState<number | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const prevStatsRef = useRef<{ received: number; lost: number } | null>(null);

    const startCall = async (
        myAudioRef: React.RefObject<HTMLAudioElement | null>,
        remoteAudioRef: React.RefObject<HTMLAudioElement | null>
    ) => {
        if (peerInstance) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({video: false, audio: true});
            localStreamRef.current = stream;
            if (myAudioRef.current) {
                myAudioRef.current.srcObject = stream;
                // ensure it plays without user gesture in some browsers
                // @ts-ignore
                myAudioRef.current.muted = true;
                myAudioRef.current.play?.().catch(() => {
                });
            }

            const callID = Math.random().toString(36).substring(2);
            const peer = new Peer(callID, {
                host: process.env.NEXT_PUBLIC_HOST,
                port: 9000,
                path: '/',
                secure: true
            });

            setPeerInstance(peer);
            setMyPeerId(callID);
            setCallColor("#e0c43a"); // connecting/awaiting call

            peer.on('call', call => {
                call.answer(stream);
                setMediaCall(call);
                setCallColor("#5de03a"); // connected
                const remoteId = (call as any).peer as string;
                // record display name if provided via PeerJS metadata
                const md: any = (call as any).metadata;
                if (md && typeof md.displayName === 'string' && md.displayName.trim().length) {
                    setPeerNames(prev => ({...prev, [remoteId]: md.displayName}));
                }
                // mark remote user as connected immediately
                setConnectedPeerIds(prev => {
                    const s = new Set(prev);
                    s.add(remoteId);
                    return Array.from(s);
                });

                call.on('stream', userAudioStream => {
                    if (remoteAudioRef.current) {
                        remoteAudioRef.current.srcObject = userAudioStream;
                        remoteAudioRef.current.play?.().catch(() => {
                        });
                    }
                });
                call.on('close', () => {
                    setCallColor('#000');
                    setMediaCall(null);
                    // remove remote from connected list
                    setConnectedPeerIds(prev => prev.filter(id => id !== remoteId));
                    setPeerNames(prev => {
                        const {[remoteId]: _, ...rest} = prev;
                        return rest;
                    });
                });
                call.on('error', () => {
                    setCallColor('#e03a3a'); // red on error
                });
            });

            peer.on('disconnected', () => setCallColor('#e03a3a'));
            peer.on('error', () => setCallColor('#e03a3a'));
            peer.on('close', () => setCallColor('#000'));

            // send your call link in the chat here if you have sendMessage:
            // sendMessage(`${process.env.NEXT_PUBLIC_APP_URL}/webrtc/${callID}`);

        } catch (error) {
            console.error("Error accessing media devices:", error);
            alert("Please allow access to microphone.");
        }
    };

    const stopCall = () => {
        try {
            const s = localStreamRef.current;
            if (s) {
                s.getTracks().forEach(t => t.stop());
            }
        } catch {
        }
        localStreamRef.current = null;
        setIsMuted(false);
        if (mediaCall) {
            try {
                (mediaCall as any).close?.();
            } catch {
            }
        }
        setMediaCall(null);
        if (peerInstance) {
            try {
                peerInstance.disconnect();
            } catch {
            }
        }
        setPeerInstance(null);
        setMyPeerId(null);
        setConnectedPeerIds([]);
        setPeerNames({});
        setNetQuality(0);
        setRttMs(null);
        setLossPct(null);
        prevStatsRef.current = null;
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

    // Poll PeerJS server for connectivity metrics (server RTT & simple failure rate)
    useEffect(() => {
        if (!peerInstance) {
            setNetQuality(0);
            setRttMs(null);
            setLossPct(null);
            return;
        }
        let mounted = true;
        const host = process.env.NEXT_PUBLIC_HOST;
        const port = 9000;
        const windowSize = 10; // number of recent pings to consider for failure %
        const results: { ok: boolean; rtt: number | null }[] = [];

        const ping = async () => {
            const start = performance.now();
            try {
                const res = await fetch(`https://${host}:${port}/peers`, {cache: 'no-store'});
                const ok = res.ok;
                const rtt = Math.round(performance.now() - start);
                if (!mounted) return;
                results.push({ok, rtt: ok ? rtt : null});
                while (results.length > windowSize) results.shift();
                const successes = results.filter(r => r.ok && r.rtt != null);
                const failures = results.filter(r => !r.ok || r.rtt == null);
                const lastRtt = successes.length ? successes[successes.length - 1].rtt! : null;
                const failurePct = results.length ? +(100 * failures.length / results.length).toFixed(2) : null;

                setRttMs(lastRtt);
                setLossPct(failurePct);

                // Map to quality using server RTT and failure percentage
                let q = 0;
                if (lastRtt != null) {
                    if (failurePct != null && failurePct >= 10) {
                        q = 1; // heavy failures -> red
                    } else if (lastRtt < 150 && (failurePct == null || failurePct < 1)) {
                        q = 3; // green
                    } else if (lastRtt < 400 && (failurePct == null || failurePct < 5)) {
                        q = 2; // orange
                    } else {
                        q = 1; // red
                    }
                } else if (failurePct != null && failurePct > 0) {
                    q = 1;
                } else {
                    q = 0;
                }
                setNetQuality(q);
            } catch (e) {
                if (!mounted) return;
                results.push({ok: false, rtt: null});
                while (results.length > windowSize) results.shift();
                const failures = results.filter(r => !r.ok || r.rtt == null);
                const failurePct = +(100 * failures.length / results.length).toFixed(2);
                setLossPct(failurePct);
                setRttMs(null);
                setNetQuality(failurePct >= 10 ? 1 : 0);
            }
        };

        const id = setInterval(ping, 2000);
        ping();
        return () => {
            mounted = false;
            clearInterval(id);
        };
    }, [peerInstance]);

    // Poll connected peers from PeerJS server while connected
    useEffect(() => {
        if (!peerInstance) return;
        let cancelled = false;
        const host = process.env.NEXT_PUBLIC_HOST;
        const port = 9000;
        const fetchPeers = async () => {
            try {
                const url = `https://${host}:${port}/peers`;
                const res = await fetch(url, {cache: 'no-store'});
                if (!res.ok) return;
                const ids: string[] = await res.json();
                if (!cancelled) setConnectedPeerIds(ids || []);
            } catch (e) {
                // ignore polling errors
            }
        };
        fetchPeers();
        const id = setInterval(fetchPeers, 3000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [peerInstance]);

    const connectedUsers = useMemo(() => {
        return connectedPeerIds
            .filter(id => id && id !== myPeerId)
            .map(id => peerNames[id] || (id.startsWith('anon-') ? 'Utilisateur Anonyme' : id));
    }, [connectedPeerIds, myPeerId, peerNames]);

    return (
        <PeerContext.Provider value={{
            peerInstance,
            callColor,
            isMuted,
            connectedUsers,
            netQuality,
            rttMs,
            lossPct,
            startCall,
            stopCall,
            toggleMute
        }}>
            {children}
        </PeerContext.Provider>
    );
};
