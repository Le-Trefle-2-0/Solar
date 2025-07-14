'use client';

import React, {createContext, useContext, useEffect, useState} from "react";
import {initSocket, joinChannel, leaveChannel} from "@/lib/socket";
import {Socket} from "socket.io-client";

interface SocketContextProps {
    socket: Socket | null;
    currentChannelID: string | null;
    setChannelID: (id: string) => void;
}

const SocketContext = createContext<SocketContextProps>({
    socket: null,
    currentChannelID: null,
    setChannelID: () => {
    }
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [currentChannelID, setCurrentChannelID] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            const res = await fetch("/api/auth/token");
            const data = await res.json();
            if (data.token) {
                const s = await initSocket(data.token);
                setSocket(s);
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
