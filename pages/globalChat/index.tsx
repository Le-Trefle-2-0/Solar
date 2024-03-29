import { event_messages, listen_message } from "@prisma/client";
import { useRouter } from "next/router";
import { LegacyRef, useContext, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io";
import ChatBubble from "../../src/components/chat_bubble";
import ChatInput from "../../src/components/chat_input";
import { ReferenceActualEventContext } from "../../src/contexts/ReferenceGlobalCHatContext";
import { SocketState } from "../../src/interfaces/socketState";
import AuthenticatedLayout from "../../src/layouts/authenticated-layout";
import { ClientEvents, ServerEvents } from "../../src/socket/Enums";
import getSession from "../../src/utils/get_session";
import 'emoji-mart/css/emoji-mart.css'

type eventMessage = (event_messages & { accounts: { id: bigint; name: string; }; });

export default function globalChat() {
    let {globalChatSocket, globalChatSocketState, event} = useContext( ReferenceActualEventContext );
    let router = useRouter();
    const [messages, setMessages] = useState<eventMessage[] | null>(null);
    const session = useRef(getSession());
    const messagesRef = useRef(messages);
    const messagesContainerRef = useRef<HTMLDivElement>();
    let [socketState, setSocketState] = useState(globalChatSocketState.current);
    let [eventState, setEventState] = useState(event.current);

    useEffect(()=>{
      if(typeof document !== 'undefined') document.addEventListener('eventContextUpdated', contextUpdated);
      return ()=>{
        if(typeof document !== 'undefined') document.removeEventListener('eventContextUpdated', contextUpdated);
      }
    }, []);

    function contextUpdated(){
      setSocketState(globalChatSocketState.current);
      setEventState(event.current);
      globalChatSocket.current?.off(ClientEvents.history);
      globalChatSocket.current?.off(ClientEvents.new_message);
      globalChatSocket.current?.emit(ServerEvents.get_history);
      globalChatSocket.current?.on(ClientEvents.history, (data: eventMessage[])=>{setMessages(data);messagesContainerRef.current?.scrollIntoView({});});
      globalChatSocket.current?.on(ClientEvents.new_message, (data: eventMessage)=>{addMessage(data)});
    }

    useEffect(()=>{contextUpdated()},[]);

    useEffect(()=>{
        messagesRef.current = messages;
    }, [messages]);
    
    function addMessage(data: eventMessage){
    setMessages([...messagesRef.current || [], data]);
        messagesContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    
    function submitText(text: string){
        globalChatSocket.current?.emit(ServerEvents.send_message,encodeURIComponent(text))
    }
    return (
      <AuthenticatedLayout>
        { socketState != SocketState.loaded ? 
          <div className="h-100 flex items-center justify-center">{
            socketState == SocketState.deactivated ? "Chargement de l'écoute" 
            : (socketState == SocketState.loading ? "Connexion à l'écoute" 
            : (socketState == SocketState.error ? "Une erreur s'est produite, essayez de recherger la page, ou contactez un administrateur":""))
          }</div>
        :
          <div className="flex flex-col h-full w-full">
            <div className="flex items-center justify-between mb-8">
              <h2>Chat de la permanence {eventState?.id} ({eventState?.subject || "aucun sujet"})</h2>
            </div>
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-trefle-green pb-5 -mr-5 pr-5">
              { messages ? messages.map((m)=><ChatBubble key={"message_"+m.id} text={decodeURIComponent(m.content_encrypted)} author={m.accounts.name} is_me={m.accounts.id == session.current?.user.id}/>) : null}
              <div ref={messagesContainerRef as LegacyRef<HTMLDivElement>} />
            </div>
            <ChatInput onSubmitText={submitText}/>
          </div>
  
        }
      </AuthenticatedLayout>
    );
}