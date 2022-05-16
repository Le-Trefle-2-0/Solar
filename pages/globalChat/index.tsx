import { event_messages, listen_message } from ".prisma/client";
import { useRouter } from "next/router";
import { LegacyRef, useContext, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io";
import ChatBubble from "../../src/components/chat_bubble";
import ChatInput from "../../src/components/chat_input";
import { ReferenceGlobalChatContext } from "../../src/contexts/ReferenceGlobalCHatContext";
import { SocketState } from "../../src/interfaces/socketState";
import AuthenticatedLayout from "../../src/layouts/authenticated-layout";
import { ClientEvents, ServerEvents } from "../../src/socket/Enums";
import getSession from "../../src/utils/get_session";
import 'emoji-mart/css/emoji-mart.css'

type eventMessage = (event_messages & { accounts: { id: bigint; name: string; }; });

export default function globalChat() {
    let {globalChatSocket, globalChatSocketState} = useContext( ReferenceGlobalChatContext );
    let router = useRouter();
    const [messages, setMessages] = useState<eventMessage[] | null>(null);
    const session = useRef(getSession());
    const messagesRef = useRef(messages);
    const messagesContainerRef = useRef<HTMLDivElement>();
    
    useEffect(()=>{
        globalChatSocket?.emit(ServerEvents.get_history);
        globalChatSocket?.on(ClientEvents.history, (data: eventMessage[])=>{setMessages(data);messagesContainerRef.current?.scrollIntoView({});})
        globalChatSocket?.on(ClientEvents.new_message, (data: eventMessage)=>{addMessage(data)})
        return () => {
            globalChatSocket?.off(ClientEvents.history)
            globalChatSocket?.off(ClientEvents.new_message)
        }
    }, []);

    useEffect(()=>{
        messagesRef.current = messages;
    }, [messages]);
    
    function addMessage(data: eventMessage){
    setMessages([...messagesRef.current || [], data]);
        messagesContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    
    function submitText(text: string){
        globalChatSocket?.emit(ServerEvents.send_message,encodeURIComponent(text))
    }
    return (
      <AuthenticatedLayout>
        { globalChatSocketState != SocketState.loaded ? 
          <div className="h-100 flex items-center justify-center">{
            globalChatSocketState == SocketState.deactivated ? "Chargement de l'écoute" 
            : (globalChatSocketState == SocketState.loading ? "Connexion à l'écoute" 
            : (globalChatSocketState == SocketState.error ? "Une erreur s'est produite, essayez de recherger la page, ou contactez un administrateur":""))
          }</div>
        :
          <div className="flex flex-col h-full w-full">
            <div className="flex items-center justify-between mb-8">
              <h2>Chat de permanence</h2>
              <div className="flex">
                <button className="btn outlined" onClick={() => router.back()}>Retour a la liste</button>
                <button className="btn ml-4" onClick={() => router.back()}>Fermer l'écoute</button>
              </div>
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