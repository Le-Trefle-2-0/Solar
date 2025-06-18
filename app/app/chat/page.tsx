"use client";

import {FormEvent, useEffect, useState} from "react";
import {socket} from "@/socket";
import {authClient} from "@/lib/auth-client";
import Image from "next/image";
import {Msg} from "@/lib/interface"
import {saveMessage} from "@/lib/messageManager";
import EmojiPicker, {EmojiStyle} from 'emoji-picker-react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faFaceSmileWink, faPaperPlane} from "@fortawesome/free-regular-svg-icons";

export default function Chat() {
    const session = authClient.useSession();
    const [isConnected, setIsConnected] = useState(false);
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [transport, setTransport] = useState("N/A");
    const [currentMsg, setCurrentMsg] = useState("");
    const [chat, setChat] = useState<Msg[]>([])

    socket.emit('listen', {id: '1'})
    useEffect(() => {
        fetch('/api/messages/1')
            .then(res => res.json())
            .then(data => setChat(data))
    }, []);

    const sendMessage = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (currentMsg !== "") {
            const msg: Msg = {
                author: {
                    id: session.data?.user.id as string,
                    name: session.data?.user.name as string,
                    image: session.data?.user.image as string
                },
                content: currentMsg,
                timestamp: Date.now(),
                channel: {
                    id: '1'
                }
            }

            saveMessage(msg)
            socket.emit("sendMessage", msg);
            setCurrentMsg("");
            setChat((pre) => [...pre, msg])
        }
    }

    useEffect(() => {
        if (socket.connected) {
            onConnect();
        }

        function onConnect() {
            setIsConnected(true);
            setTransport(socket.io.engine.transport.name);

            socket.io.engine.on("upgrade", (transport) => {
                setTransport(transport.name);
            });
        }

        function onDisconnect() {
            setIsConnected(false);
            setTransport("N/A");
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("message", (data: Msg) => {
            setChat((pre) => [...pre, data])
        })

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, []);

    return (
        <div>
            <div className="flex flex-col justify-between h-screen p-3">
                <div className="flex flex-col justify-start h-screen gap-6 overflow-auto">
                    {chat.map(({author, content, timestamp}, key) => (
                        <div className="w-full flex flex-row gap-2" key={key}>
                            <Image src={(author.image ? author.image : '/logo.svg')} alt="Image de profil" width={48}
                                   height={48} className="rounded-xl"/>
                            <div>
                                <div className="flex flex-row items-center gap-4">
                                    <span className="font-semibold text-sm font-bold text-gray-900">
                                        {author.name}
                                    </span>
                                    <span className="font-light text-sm text-gray-900">
                                        {new Date(timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <h3 className="text-lg text-gray-900">
                                    {content}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute right-2 bottom-15">
                    <EmojiPicker emojiStyle={EmojiStyle.TWITTER} onEmojiClick={(emoji) => {
                        setCurrentMsg(currentMsg + ' ' + emoji.emoji);
                    }} open={emojiOpen}/>
                </div>

                <form onSubmit={(e) => sendMessage(e)} className='flex flex-row w-full gap-2 items-center'>
                    <input
                        type="text"
                        value={currentMsg}
                        placeholder="Envoyer un message dans permanence"
                        onChange={(e) => setCurrentMsg(e.target.value)}
                        className="w-full flex flex-row w-full outline-main outline-1 p-2 rounded-lg"
                    />
                    <FontAwesomeIcon icon={faFaceSmileWink} width={32} onClick={() => {
                        console.log('emoji click')
                        if (emojiOpen) setEmojiOpen(false);
                        else setEmojiOpen(true);
                    }} className='cursor-pointer'/>
                    <button className='cursor-pointer'><FontAwesomeIcon icon={faPaperPlane} width={32}/></button>
                </form>
            </div>
        </div>
    );
}