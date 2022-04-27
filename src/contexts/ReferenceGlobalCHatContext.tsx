import { getCookie } from "cookies-next";
import { Context, createContext, Dispatch, SetStateAction, useEffect, useState } from "react";
import {  io, Socket } from "socket.io-client";
import session from "../interfaces/session";
import { SocketState } from "../interfaces/socketState";
import { ClientEvents, ServerEvents } from "../socket/Enums";
import { ClientType, SessionType } from "../socket/ServerActions/SocketAuth";


let ReferenceGlobalChatContext : Context<{globalChatSocket: Socket|undefined, setGlobalChatSocket: Dispatch<SetStateAction<Socket|undefined>>, globalChatSocketState: SocketState}>;

const ReferenceGlobalChatContextProvider = ({ children } : any) => {
    const [socketState, setSocketState] = useState<SocketState>(SocketState.deactivated);
    const [globalChatSocket, setGlobalChatSocket] = useState<Socket>();
    ReferenceGlobalChatContext = createContext({ globalChatSocket, setGlobalChatSocket, globalChatSocketState: socketState });
    
    useEffect(()=>{(async ()=>{
        await fetch("/api/socket");
        let socket = io()
        let sesRaw = getCookie("session");
        let ses: session | undefined;
        if(sesRaw != undefined && typeof sesRaw != "boolean") ses = JSON.parse(sesRaw);
        socket?.on("connect", ()=>{
            socket?.emit(ServerEvents.login, ses, "eventChat" as SessionType, 1, "app" as ClientType)
        });
        socket?.on(ClientEvents.auth_invalid, ()=>{setSocketState(SocketState.error)})
        socket?.on(ClientEvents.auth_refused, ()=>{setSocketState(SocketState.unauthenticated)})
        socket?.on(ClientEvents.auth_accepted, ()=>{setSocketState(SocketState.loaded); socket?.emit(ServerEvents.get_history);})
        setGlobalChatSocket(socket);
    })()}, [])

    return (
        <ReferenceGlobalChatContext.Provider value={{ globalChatSocket, setGlobalChatSocket, globalChatSocketState: socketState }}>
            {children}
        </ReferenceGlobalChatContext.Provider>
    );
};

export { ReferenceGlobalChatContext, ReferenceGlobalChatContextProvider };