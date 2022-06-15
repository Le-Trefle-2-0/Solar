import { Context, createContext, MutableRefObject,useEffect, useRef } from "react";
import {  io, Socket } from "socket.io-client";
import { SocketState } from "../interfaces/socketState";
import { ClientEvents, ServerEvents } from "../socket/Enums";
import { ClientType, SessionType } from "../socket/ServerActions/SocketAuth";
import fetcher from "../utils/fetcher";
import getSession from "../utils/get_session";
import { calendar_events } from '@prisma/client';


let ReferenceActualEventContext : Context<{globalChatSocket: MutableRefObject<Socket|undefined>, globalChatSocketState:  MutableRefObject<SocketState>, event:  MutableRefObject<calendar_events|undefined>, update: () => void}>;

const ReferenceActualEventContextProvider = ({ children } : any) => {
    const socketState = useRef<SocketState>(SocketState.deactivated);
    const globalChatSocket = useRef<Socket>();
    const event = useRef<calendar_events>();
    const loggedEventId = useRef<bigint>();
    ReferenceActualEventContext = createContext({ globalChatSocket: globalChatSocket, globalChatSocketState: socketState, event: event, update });
    const session =  useRef(getSession());
    const interval = useRef<NodeJS.Timeout>();

    useEffect(()=>{(async ()=>{
        await fetch("/api/socket");
        let socket = io()
        socket?.on("connect", ()=>{
            loginToEvent();
            if(typeof document !== 'undefined') document.addEventListener("eventContextNeedUpdate", loginToEvent);
        });
        socket?.on(ClientEvents.auth_invalid, ()=>{socketState.current = SocketState.error;loggedEventId.current = undefined;dispatchEvent();})
        socket?.on(ClientEvents.auth_removed, ()=>{socketState.current = SocketState.deactivated;loggedEventId.current = undefined;dispatchEvent();})
        socket?.on(ClientEvents.auth_refused, ()=>{socketState.current = SocketState.unauthenticated;loggedEventId.current = undefined;dispatchEvent();})
        socket?.on(ClientEvents.auth_accepted, ()=>{socketState.current = SocketState.loaded; socket?.emit(ServerEvents.get_history);dispatchEvent();})
        globalChatSocket.current = socket;
        interval.current = setInterval(()=>{loginToEvent()}, 30000);
        return () => {
            clearInterval(interval.current);
            if(typeof document !== 'undefined') document.removeEventListener("eventContextNeedUpdate", loginToEvent);
        }
    })()}, [])

    async function loginToEvent(){
        if(session.current == undefined){
            session.current = getSession();
            if(session.current == undefined)return;
        }
        let activeEvent: calendar_events | null = await fetcher("/api/events/getActive");
        if(activeEvent == null) {
            if(globalChatSocket.current?.connected) globalChatSocket.current?.emit(ServerEvents.logout);
            event.current = undefined;
        } else if(loggedEventId.current != activeEvent.id){
            if(globalChatSocket.current?.connected) globalChatSocket.current?.emit(ServerEvents.login, session?.current, "eventChat" as SessionType, parseInt(activeEvent.id.toString()), "app" as ClientType);
            loggedEventId.current = activeEvent.id;
            event.current = activeEvent;
        }
        dispatchEvent();
    }

    function dispatchEvent(){
        if(typeof document !== 'undefined') document.dispatchEvent(new Event('eventContextUpdated'))
    }
    function update(){
        if(typeof document !== 'undefined') document.dispatchEvent(new Event('eventContextNeedUpdate'))
    }

    return (
        <ReferenceActualEventContext.Provider value={{ globalChatSocket:globalChatSocket, globalChatSocketState: socketState, event: event, update}}>
            {children}
        </ReferenceActualEventContext.Provider>
    );
};

export { ReferenceActualEventContext, ReferenceActualEventContextProvider };