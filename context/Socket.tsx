'use client';

import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import {initSocket, joinChannel, leaveChannel} from "@/lib/socket";
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
            const res = await fetch("/api/auth/token");
            const data = await res.json();
            if (data.token) {
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

                    let msgLink = data.channel.id === "1"
                        ? `${process.env.NEXT_PUBLIC_APP_URL}/app/chat`
                        : `${process.env.NEXT_PUBLIC_APP_URL}/app/ticket/${data.channel.id}`;

                    if (channelID === "" || data.channel.id === channelID) return;

                    const body = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/channel/${data.channel.id}`);
                    const res = await body.json();

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
