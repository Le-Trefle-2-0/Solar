'use client';

import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import {initSocket, joinChannel, leaveChannel} from "@/lib/socket";
import {apiFetch} from "@/lib/api";
import {Socket} from "socket.io-client";
import {usePathname, useRouter} from "next/navigation";
import {toast} from "sonner";

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
        const init = async () => {
            try {
                const res = await fetch("/api/auth/token", {cache: 'no-store'});
                const ct = res.headers.get('content-type') || '';
                if (!res.ok || !ct.includes('application/json')) {
                    // eslint-disable-next-line no-console
                    console.warn('[ws] token endpoint returned non-JSON or non-OK', res.status);
                    setConnecting(false);
                    return;
                }
                const data = await res.json();
                if (!data?.token) {
                    // eslint-disable-next-line no-console
                    console.warn('[ws] no JWT token found from /api/auth/token');
                    setConnecting(false);
                    return;
                }
                const s = await initSocket(data.token);
                setSocket(s);
                setConnecting(true);

                // Always show overlay while establishing (or re-establishing) the first connection
                setShowOverlay(true);
                if (!overlayTimerRef.current) overlayTimerRef.current = setTimeout(() => setTrouble(true), 5000);

                s?.on('connect', () => {
                    setConnected(true);
                    setConnecting(false);
                    setShowOverlay(false);
                    setTrouble(false);
                    if (overlayTimerRef.current) {
                        clearTimeout(overlayTimerRef.current);
                        overlayTimerRef.current = null;
                    }
                });

                s?.on('connect_error', () => {
                    setConnected(false);
                    setConnecting(false);
                    // show overlay briefly, then auto-hide so UI is usable
                    setShowOverlay(true);
                    if (!overlayTimerRef.current) overlayTimerRef.current = setTimeout(() => setTrouble(true), 5000);
                    // Auto-hide the blocking overlay after 8s even if still failing
                    setTimeout(() => setShowOverlay(false), 8000);
                });

                s?.on('disconnect', () => {
                    setConnected(false);
                    setShowOverlay(true);
                    if (!overlayTimerRef.current) overlayTimerRef.current = setTimeout(() => setTrouble(true), 5000);
                    // Auto-hide after a while to prevent indefinite blocking
                    setTimeout(() => setShowOverlay(false), 8000);
                });

                s?.io.on('reconnect_attempt', () => {
                    setShowOverlay(true);
                    if (!overlayTimerRef.current) overlayTimerRef.current = setTimeout(() => setTrouble(true), 5000);
                });

                s?.io.on('reconnect', () => {
                    setConnected(true);
                    setShowOverlay(false);
                    setTrouble(false);
                    if (overlayTimerRef.current) {
                        clearTimeout(overlayTimerRef.current);
                        overlayTimerRef.current = null;
                    }
                });

                s?.on('message', async (data) => {
                    const currentPath = currentPathRef.current; // read latest value

                    let channelID = "";
                    if (currentPath.endsWith("/app/chat")) {
                        channelID = "1";
                    } else if (currentPath.startsWith("/app/ticket")) {
                        const splits = currentPath.split("/");
                        channelID = splits[splits.length - 1];
                    }

                    // Build relative links to avoid relying on environment base URL
                    let msgLink = data.channel.id === "1"
                        ? `/app/chat`
                        : `/app/ticket/${data.channel.id}`;

                    if (channelID === "" || data.channel.id === channelID) return;

                    let res: any;
                    try {
                        res = await apiFetch(`/v1/channel/${data.channel.id}`);
                    } catch {
                        return; // silently ignore invalid responses for toast
                    }

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
                });

                const interval = setInterval(() => s?.emit('heartbeat'), 5000);

                return () => {
                    s?.off('message');
                    s?.off('connect');
                    s?.off('connect_error');
                    s?.off('disconnect');
                    s?.io.off('reconnect_attempt');
                    s?.io.off('reconnect');
                    clearInterval(interval);
                    if (overlayTimerRef.current) {
                        clearTimeout(overlayTimerRef.current);
                        overlayTimerRef.current = null;
                    }
                };
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('[ws] failed to init socket', e);
                setConnecting(false);
            }
        };
        init();
    }, []);

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
