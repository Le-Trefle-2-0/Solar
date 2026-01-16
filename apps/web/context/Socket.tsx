'use client';

import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import {closeSocket, initSocket, joinChannel, leaveChannel} from "@/lib/socket";
import {apiFetch, clearJwtCache, getJwt} from "@/lib/api";
import {Socket} from "socket.io-client";
import {usePathname, useRouter} from "next/navigation";
import {toast} from "sonner";
import {useSession} from "@/lib/auth-client";

interface SocketContextProps {
    socket: Socket | null;
    currentChannelID: string | null;
    setChannelID: (id: string) => void;
    connected: boolean;
}

const SocketContext = createContext<SocketContextProps>({
    socket: null,
    currentChannelID: null,
    setChannelID: () => {
    },
    connected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const pathname = usePathname();
    const router = useRouter();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [currentChannelID, setCurrentChannelID] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(true);
    const [showOverlay, setShowOverlay] = useState(false);
    const [trouble, setTrouble] = useState(false);
    const currentPathRef = useRef<string>(pathname); // add ref
    const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        currentPathRef.current = pathname;
    }, [pathname]);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            const register = () => {
                navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW registration failed:', err));
            };
            if (document.readyState === 'complete') {
                register();
            } else {
                window.addEventListener('load', register);
                return () => window.removeEventListener('load', register);
            }
        }
    }, []);

    const {data: session, isPending} = useSession();

    useEffect(() => {
        let mounted = true;
        let retryTimer: NodeJS.Timeout | null = null;

        if (isPending) return;

        if (!session) {
            closeSocket();
            setSocket(null);
            setConnected(false);
            setConnecting(false);
            return;
        }

        const init = async () => {
            try {
                // When session changes, we must clear the JWT cache to get a fresh one
                clearJwtCache();
                const token = await getJwt();
                if (!token) {
                    if (!mounted) return;
                    console.warn('[ws] no JWT token found');
                    // Retry in 2 seconds if no token (maybe session is still loading)
                    retryTimer = setTimeout(init, 2000);
                    setConnecting(false);
                    return;
                }
                const s = await initSocket(token);
                if (mounted) {
                    setSocket(s);
                    setConnecting(true);
                }
            } catch (e) {
                if (mounted) {
                    console.error('[ws] failed to init socket', e);
                    setConnecting(false);
                }
            }
        };

        init();

        return () => {
            mounted = false;
            if (retryTimer) clearTimeout(retryTimer);
        };
    }, [session, isPending]);

    useEffect(() => {
        if (!socket) return;

        // Always show overlay while establishing (or re-establishing) the first connection
        setShowOverlay(true);
        if (!overlayTimerRef.current) overlayTimerRef.current = setTimeout(() => setTrouble(true), 5000);

        const onConnect = () => {
            setConnected(true);
            setConnecting(false);
            setShowOverlay(false);
            setTrouble(false);
            if (overlayTimerRef.current) {
                clearTimeout(overlayTimerRef.current);
                overlayTimerRef.current = null;
            }
        };

        const onConnectError = () => {
            setConnected(false);
            setConnecting(false);
            setShowOverlay(true);
            if (!overlayTimerRef.current) overlayTimerRef.current = setTimeout(() => setTrouble(true), 5000);
            setTimeout(() => setShowOverlay(false), 8000);
        };

        const onDisconnect = () => {
            setConnected(false);
            setShowOverlay(true);
            if (!overlayTimerRef.current) overlayTimerRef.current = setTimeout(() => setTrouble(true), 5000);
            setTimeout(() => setShowOverlay(false), 8000);
        };

        const onReconnectAttempt = () => {
            setShowOverlay(true);
            if (!overlayTimerRef.current) overlayTimerRef.current = setTimeout(() => setTrouble(true), 5000);
        };

        const onReconnect = () => {
            setConnected(true);
            setShowOverlay(false);
            setTrouble(false);
            if (overlayTimerRef.current) {
                clearTimeout(overlayTimerRef.current);
                overlayTimerRef.current = null;
            }
        };

        socket.on('connect', onConnect);
        socket.on('connect_error', onConnectError);
        socket.on('disconnect', onDisconnect);
        socket.io.on('reconnect_attempt', onReconnectAttempt);
        socket.io.on('reconnect', onReconnect);

        const heartbeatInterval = setInterval(() => socket.emit('heartbeat'), 5000);

        return () => {
            socket.off('connect', onConnect);
            socket.off('connect_error', onConnectError);
            socket.off('disconnect', onDisconnect);
            socket.io.off('reconnect_attempt', onReconnectAttempt);
            socket.io.off('reconnect', onReconnect);
            clearInterval(heartbeatInterval);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const onMessage = async (data: any) => {
            const currentPath = currentPathRef.current;
            // ... (rest of onMessage)
            let channelID = "";
            if (currentPath.endsWith("/app/chat")) {
                channelID = "1";
            } else if (currentPath.startsWith("/app/ticket")) {
                const splits = currentPath.split("/");
                channelID = splits[splits.length - 1];
            }

            let msgLink = data.channel.id === "1"
                ? `/app/chat`
                : `/app/ticket/${data.channel.id}`;

            if (channelID === "" || data.channel.id === channelID) return;

            try {
                const res = await apiFetch(`/v1/channel/${data.channel.id}`);
                toast(null, {
                    description: (
                        <div onClick={() => router.push(msgLink)} className="cursor-pointer flex flex-col">
                            <code
                                className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                                {data.author.name} - {res.name}
                            </code>
                            <h3 className="text-md text-gray-900 whitespace-pre-wrap break-words max-w-full">
                                {data.content}
                            </h3>
                        </div>
                    ),
                });
            } catch {
                // silent
            }
        };

        socket.on('message', onMessage);

        return () => {
            socket.off('message', onMessage);
            if (overlayTimerRef.current) {
                clearTimeout(overlayTimerRef.current);
                overlayTimerRef.current = null;
            }
        };
    }, [socket, router]);

    useEffect(() => {
        if (!socket) return;
        if (currentChannelID) {
            joinChannel(currentChannelID);
        }

        return () => {
            if (currentChannelID) {
                leaveChannel(currentChannelID);
            }
        };
    }, [currentChannelID, socket]);

    return (
        <SocketContext.Provider value={{socket, currentChannelID, setChannelID: setCurrentChannelID, connected}}>
            {showOverlay && (
                <div
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/90 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <img src="/logo.svg" alt="Solar" className="h-16 w-16 animate-pulse-scale"/>
                        <p className="text-sm text-muted-foreground text-center px-4">
                            {trouble ? 'Nous rencontrons des difficultés de connexion. Nouvelle tentative…' : ''}
                        </p>
                    </div>
                    <style>{`
                        .animate-pulse-scale { animation: pulseScale 1.2s ease-in-out infinite alternate; }
                        @keyframes pulseScale { from { transform: scale(1); } to { transform: scale(1.15); } }
                    `}</style>
                </div>
            )}
            {children}
        </SocketContext.Provider>
    );
};
