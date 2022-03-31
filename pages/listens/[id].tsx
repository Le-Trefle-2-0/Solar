import useSWR from "swr";
import { fetcherAuth } from "../../src/utils/fetcher";
import AuthenticatedLayout from "../../src/layouts/authenticated-layout";
import React, { useEffect, useState } from "react";
import { ListenWithStatus } from "../../src/interfaces/listens";
import { useRouter } from "next/router";
import { io, Socket } from "socket.io-client";
import { getCookie } from "cookies-next";
import session from "../../src/interfaces/session";
import { ClientType, SessionType } from "../../src/socket/ServerActions/SocketAuth";
import { ClientEvents, ServerEvents } from "../../src/socket/Enums";

let socket: Socket;

enum SocketState{
  unauthenticated,
  deactivated,
  loading,
  error,
  loaded
}

export default function Listens(){
  const router = useRouter();
  const listenSwr = useSWR<ListenWithStatus|null>(`/api/listens/${router.query.id}?not_done=true`, fetcherAuth);
  const [socketState, setSocketState] = useState<SocketState>(SocketState.deactivated);

  if(listenSwr.data && socketState == SocketState.deactivated){
    setSocketState(SocketState.loading);
  }

  const listen = listenSwr.data || null;

  useEffect(()=>{
    if(socketState == SocketState.unauthenticated) {router.push("/auth/login");}
    if(socketState == SocketState.loading && listen){
      (async()=>{
        await fetch("/api/socket");
        let sesRaw = getCookie("session");
        let ses: session | undefined;
        if(sesRaw != undefined && typeof sesRaw != "boolean") ses = JSON.parse(sesRaw);
        socket = io();
        socket.on("connect", ()=>{
          socket.emit(ServerEvents.login, ses, "listenChat" as SessionType, listen.id, "app" as ClientType)
        });
        socket.on(ClientEvents.auth_invalid, ()=>{setSocketState(SocketState.error)})
        socket.on(ClientEvents.auth_refused, ()=>{setSocketState(SocketState.unauthenticated)})
        socket.on(ClientEvents.auth_accepted, ()=>{setSocketState(SocketState.loaded); socket.emit(ServerEvents.get_history);})
        socket.on(ClientEvents.history, (data)=>{console.log(data)})
      })()
    }
  }, [socketState]);

  return (
    <AuthenticatedLayout>
      { socketState != SocketState.loaded ? 
        <div className="h-100 flex items-center justify-center">{
          socketState == SocketState.deactivated ? "Chargement de l'écoute" 
          : (socketState == SocketState.loading ? "Connexion à l'écoute" 
          : (socketState == SocketState.error ? "Une erreur s'est produite, essayez de recherger la page, ou contactez un administrateur":""))
        }</div>
      :
        <div className="flex items-center justify-between mb-8">
          <h2>ÉCOUTE #{listen?.id}</h2>
          <div className="flex">
            <button className="btn outlined" onClick={() => router.back()}>Retour a la liste</button>
            <button className="btn ml-4" onClick={() => router.back()}>Fermer l'écoute</button>
          </div>
        </div>
      }
    </AuthenticatedLayout>
  );
}