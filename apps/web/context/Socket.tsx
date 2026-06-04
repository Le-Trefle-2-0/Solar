'use client';

import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import {initSocket, joinChannel, leaveChannel} from "@/lib/socket";
import {apiFetch, getJwt} from "@/lib/api";
import {authClient} from "@/lib/auth-client";
import {PERMISSION_METADATA} from "@/lib/permissions";
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
    const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            try {
                const token = await getJwt();
                if (!token) {
                    if (isMounted) {
                        console.warn('[ws] no JWT token found, retrying...');
                        setTimeout(init, 2000);
                    }
                    return;
                }
                const s = await initSocket(token);
                if (isMounted) {
                    setSocket(s);
                    setConnecting(false);
                }
            } catch (e) {
                console.error('[ws] failed to init socket', e);
                if (isMounted) setConnecting(false);
            }
        };
        init();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        // Initial state check based on current socket status
        const isConnected = socket.connected;
        setConnected(isConnected);
        setShowOverlay(!isConnected);
        if (!isConnected && !overlayTimerRef.current) {
            overlayTimerRef.current = setTimeout(() => setTrouble(true), 5000);
        }

        const onConnect = () => {
            setConnected(true);
            setConnecting(false);
            setShowOverlay(false);
            setTrouble(false);
            if (overlayTimerRef.current) {
                clearTimeout(overlayTimerRef.current);
                overlayTimerRef.current = null;
            }
            if (disconnectTimerRef.current) {
                clearTimeout(disconnectTimerRef.current);
                disconnectTimerRef.current = null;
            }
        };

        const onConnectError = (err: any) => {
            setConnected(false);
            setConnecting(false);
            // Don't show overlay immediately on connect error if we were already connected
            // This prevents blinking when switching transports or during brief interruptions
            if (!connected && !socket.active) {
                setShowOverlay(true);
            }
        };

        const onDisconnect = (reason: string) => {
            setConnected(false);
            console.warn('[ws] disconnected:', reason);

            // If it's a deliberate disconnect, don't show overlay
            if (reason === 'io client disconnect' || reason === 'io server disconnect') return;

            // Wait 2 seconds before showing overlay to handle micro-reconnections
            if (!disconnectTimerRef.current) {
                disconnectTimerRef.current = setTimeout(() => {
                    if (!socket.connected) {
                        setShowOverlay(true);
                        if (!overlayTimerRef.current) overlayTimerRef.current = setTimeout(() => setTrouble(true), 5000);
                    }
                }, 2000);
            }
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

        return () => {
            socket.off('connect', onConnect);
            socket.off('connect_error', onConnectError);
            socket.off('disconnect', onDisconnect);
            socket.io.off('reconnect_attempt', onReconnectAttempt);
            socket.io.off('reconnect', onReconnect);
            if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
        };
    }, [socket, connected]);

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

        const onPermissionsUpdate = async (data: { roleId: string, roleName: string, permissions: string[] }) => {
            const {data: session} = await authClient.getSession();
            if (!session) return;

            const userRoles = (session.user.role || "").split(",").map((r: string) => r.trim());

            // If the updated role is one of the user's roles
            if (userRoles.includes(data.roleName)) {
                // Refresh the session to update permissions in Better Auth state
                await authClient.getSession({
                    fetchOptions: {
                        cache: "no-store"
                    }
                });

                // Check if user still has access to the current page
                // We use a small timeout to let the session state update
                setTimeout(() => {
                    const currentPath = currentPathRef.current;
                    // Simple path-based check for common admin/restricted routes
                    // In a more robust system, we would check the actual permissions required for the route
                    const restrictedPages: Record<string, string> = {
                        '/app/admin/roles': 'admin.sudo', // or check manager weight
                        '/app/admin/users': 'management.create_account',
                        '/app/admin/history': 'management.ticket_history',
                        '/app/admin/stats': 'management.view_stats',
                        '/app/admin/settings': 'admin.sudo',
                        '/app/newsletters': 'newsletters.manage',
                        '/app/recruitments': 'admin.sudo', // typically
                    };

                    for (const [route, permission] of Object.entries(restrictedPages)) {
                        if (currentPath.startsWith(route)) {
                            // This is a simplified check. Ideally we'd re-fetch permissions.
                            // But better-auth might handle this if we use its hooks in the pages.
                            // For now, let's force a reload if they are on an admin page to be safe
                            // or re-verify via apiFetch.
                            apiFetch('/v1/auth/get-session').then(newSession => {
                                const newRoles = (newSession.user.role || "").split(",").map((r: string) => r.trim());
                                const isAdmin = newRoles.includes("admin");
                                const isManager = newRoles.includes("manager");
                                const isNewsletter = newRoles.includes("newsletterManager");

                                let hasAccess = true;
                                if (route.startsWith('/app/admin') && !isAdmin && !isManager) hasAccess = false;
                                if (route.startsWith('/app/newsletters') && !isAdmin && !isNewsletter) hasAccess = false;
                                if (route.startsWith('/app/recruitments') && !isAdmin && !isManager) hasAccess = false;

                                if (!hasAccess) {
                                    toast.error("Vous n'avez plus accès à cette page.");
                                    router.push('/app');
                                }
                            });
                        }
                    }
                }, 500);
            }
        };

        socket.on('permissionsUpdate', onPermissionsUpdate);

        return () => {
            socket.off('message', onMessage);
            socket.off('permissionsUpdate', onPermissionsUpdate);
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
                        <img src="/logo.svg" alt="Le Trèfle 2.0" className="h-16 w-16 animate-pulse-scale"/>
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
