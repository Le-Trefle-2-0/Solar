import { Context, createContext, Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import {  io, Socket } from "socket.io-client";
import session from "../interfaces/session";
import { SocketState } from "../interfaces/socketState";
import { ClientEvents, ServerEvents } from "../socket/Enums";
import { ClientType, SessionType } from "../socket/ServerActions/SocketAuth";
import getSession from "../utils/get_session";


let ReferenceGlobalChatContext : Context<{globalChatSocket: Socket|undefined, setGlobalChatSocket: Dispatch<SetStateAction<Socket|undefined>>, globalChatSocketState: SocketState}>;

const ReferenceGlobalChatContextProvider = ({ children } : any) => {
    const [socketState, setSocketState] = useState<SocketState>(SocketState.deactivated);
    const [globalChatSocket, setGlobalChatSocket] = useState<Socket>();
    ReferenceGlobalChatContext = createContext({ globalChatSocket, setGlobalChatSocket, globalChatSocketState: socketState });
    const session =  useRef(getSession());

    useEffect(()=>{(async ()=>{
        await fetch("/api/socket");
        let socket = io()
        socket?.on("connect", ()=>{
            socket?.emit(ServerEvents.login, session?.current, "eventChat" as SessionType, 1, "app" as ClientType)
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