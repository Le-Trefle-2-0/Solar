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
}

const SocketContext = createContext<SocketContextProps>({
    socket: null,
    currentChannelID: null,
    setChannelID: () => {
    },
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const pathname = usePathname();
    const router = useRouter();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [currentChannelID, setCurrentChannelID] = useState<string | null>(null);
    const currentPathRef = useRef<string>(pathname); // add ref

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
                    return;
                }
                const data = await res.json();
                if (!data?.token) {
                    // eslint-disable-next-line no-console
                    console.warn('[ws] no JWT token found from /api/auth/token');
                    return;
                }
                const s = await initSocket(data.token);
                setSocket(s);

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
                    clearInterval(interval);
                };
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('[ws] failed to init socket', e);
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
        <SocketContext.Provider value={{socket, currentChannelID, setChannelID: setCurrentChannelID}}>
            {children}
        </SocketContext.Provider>
    );
};
