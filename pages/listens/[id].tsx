import useSWR from "swr";
import { fetcherAuth } from "../../src/utils/fetcher";
import AuthenticatedLayout from "../../src/layouts/authenticated-layout";
import React, { LegacyRef, useEffect, useRef, useState, Fragment } from "react";
import { ListenWithStatusAndAccounts } from "../../src/interfaces/listens";
import { useRouter } from "next/router";
import { io, Socket } from "socket.io-client";
import { ClientType, SessionType } from "../../src/socket/ServerActions/SocketAuth";
import { ClientEvents, ServerEvents } from "../../src/socket/Enums";
import 'emoji-mart/css/emoji-mart.css'
import ChatInput from "../../src/components/chat_input";
import { messages } from "@prisma/client";
import ChatBubble from "../../src/components/chat_bubble";
import getSession from "../../src/utils/get_session";
import { SocketState } from "../../src/interfaces/socketState";
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import prisma_instance from "../../src/utils/prisma_instance";

type listenMessage = (messages & { accounts: { id: bigint; name: string; }; });

export default function Listens(){
  const router = useRouter();
  const listenSwr = useSWR<ListenWithStatusAndAccounts|null>(router.query.id?`/api/listens/${router.query.id}?not_done=true&with_users=true`:null, fetcherAuth);
  const [socketState, setSocketState] = useState<SocketState>(SocketState.deactivated);
  const [messages, setMessages] = useState<listenMessage[] | null>(null);
  const session = useRef(getSession());
  const [socket, setSocket] = useState<Socket>();
  const messagesRef = useRef(messages);
  const messagesContainerRef = useRef<HTMLDivElement>();

  if(listenSwr.data && socketState == SocketState.deactivated){
    setSocketState(SocketState.loading);
  }

  const listen = listenSwr.data || null;

  useEffect(()=>{
    if(socketState == SocketState.unauthenticated) {router.push("/auth/login");}
    if(listenSwr.data && listenSwr.data.listen_status.name == 'closed'){router.push("/listens");}
    if(socketState == SocketState.loading && listen  != null ){
      (async()=>{
        await fetch("/api/socket");
        let socket = io();
        socket?.on("connect", ()=>{
          socket?.emit(ServerEvents.login, session.current, "listenChat" as SessionType, listen.id, "app" as ClientType)
        });
        socket?.on(ClientEvents.auth_invalid, ()=>{setSocketState(SocketState.error)})
        socket?.on(ClientEvents.auth_refused, ()=>{setSocketState(SocketState.unauthenticated)})
        socket?.on(ClientEvents.auth_accepted, ()=>{setSocketState(SocketState.loaded); socket?.emit(ServerEvents.get_history);})
        socket?.on(ClientEvents.history, (data)=>{setMessages(data);messagesContainerRef.current?.scrollIntoView({});})
        socket?.on(ClientEvents.new_message, (data: listenMessage)=>{addMessage(data)})
        setSocket(socket);
      })()
    }
  }, [socketState]);


  useEffect(()=>{
    messagesRef.current = messages;
  }, [messages]);

  function addMessage(data: listenMessage){
    setMessages([...messagesRef.current || [], data]);
    messagesContainerRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function submitText(text: string){
    socket?.emit(ServerEvents.send_message,encodeURIComponent(text))
  }

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }

  console.log(session.current)

  let people = [
    {
      id: 1,
      name: 'Exemple 1'
    }
  ];
  
  if (available) {
    let id = 1;
    for (let i of available) {
      id++;
      people.push({
        id: id,
        name: i.name
      });
    }
  }

  let [selected, setSelected] = useState(people[0]);

  return (
    <AuthenticatedLayout>
      { socketState != SocketState.loaded ? 
        <div className="h-100 flex items-center justify-center">{
          socketState == SocketState.deactivated ? "Chargement de l'écoute" 
          : (socketState == SocketState.loading ? "Connexion à l'écoute" 
          : (socketState == SocketState.error ? "Une erreur s'est produite, essayez de recharger la page, ou contactez un administrateur":""))
        }</div>
      :
        <div className="flex flex-col h-full w-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-row gap-4">
              <h2>ÉCOUTE {listen?.id}</h2>
              <Listbox value={selected} onChange={setSelected}>
                {({ open }) => (
                  <>
                    <div className="relative mt-2">
                      <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
                        <span className="flex items-center">
                          <span className="ml-3 block truncate">{selected.name}</span>
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                      </Listbox.Button>

                      <Transition
                        show={open}
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {people.map((person) => (
                            <Listbox.Option
                              key={person.id}
                              className={({ active }) =>
                                classNames(
                                  active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                                  'relative cursor-default select-none py-2 pl-3 pr-9'
                                )
                              }
                              value={person}
                            >
                              {({ selected, active }) => (
                                <>
                                  <div className="flex items-center">
                                    <span
                                      className={classNames(selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate')}
                                    >
                                      {person.name}
                                    </span>
                                  </div>

                                  {selected ? (
                                    <span
                                      className={classNames(
                                        active ? 'text-white' : 'text-indigo-600',
                                        'absolute inset-y-0 right-0 flex items-center pr-4'
                                      )}
                                    >
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </>
                )}
              </Listbox>
            </div>
            <div className="flex">
              <button className="btn outlined" onClick={() => router.back()}>Retour a la liste</button>
              <button className="btn ml-4" onClick={async() =>{
                if(confirm("Êtes-vous sur de vouloir fermer l'écoute?\nCette action est irréversible!")){
                  fetch(`/api/listens/${listen?.id}`, {method: "PUT", body: JSON.stringify({listen_status_id: 3})}).then((r)=>{if(r.ok){listenSwr.mutate();}}).then(() => {
                    router.back();
                  });
                }
              }}>Fermer l'écoute</button>
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
