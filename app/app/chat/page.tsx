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
import {faCircle} from "@fortawesome/free-solid-svg-icons";

export default function Chat() {
    const session = authClient.useSession();
    const [isConnected, setIsConnected] = useState(false);
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [showTyping, setShowTyping] = useState(false);
    const [transport, setTransport] = useState("N/A");
    const [currentMsg, setCurrentMsg] = useState("");
    const [chat, setChat] = useState<Msg[]>([])
    const [opacity, setOpacity] = useState<number[]>([25, 50, 75]);
    const [opacityDirection, setOpacityDirection] = useState<boolean[]>([true, true, false])

    socket.emit('listen', {id: '1'})
    useEffect(() => {
        fetch('/api/messages/1')
            .then(res => res.json())
            .then(data => setChat(data))
    }, []);
    let oldMsg = currentMsg;
    setInterval(() => {
        if (oldMsg !== currentMsg) {
            socket.emit('typing', {id: '1'});
            oldMsg = currentMsg;
        }
    }, 1000)

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
    const sendTyping = async () => {
        await socket.emit('typing', {id: '1'});
    }

    setInterval(() => {
        let newOpacity = [];
        for (let i in opacity) {
            switch (opacityDirection[i]) {
                case true:
                    newOpacity.push(opacity[i]++);
                    if (newOpacity[i] >= 75) {
                        let oldDir = opacityDirection;
                        oldDir[i] = false;
                        setOpacityDirection(oldDir);
                    }
                    break;

                case false:
                    newOpacity.push(opacity[i]--);
                    if (newOpacity[i] <= 25) {
                        let oldDir = opacityDirection;
                        oldDir[i] = true;
                        setOpacityDirection(oldDir);
                    }
                    break;
            }
        }
        setOpacity(newOpacity);
        console.log(newOpacity);
    }, 100000)

    let typingTimeout = setTimeout(() => {
    });

    function typing() {
        setShowTyping(true);
        if (typingTimeout) clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            setShowTyping(false);
        }, 5000);
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
        });
        socket.on('typingIndicator', typing);

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
                                    <span className="font-semibold text-sm text-gray-900">
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
                <div
                    className={showTyping ? 'flex flex-row gap-1 relative left-2 bottom-3' : 'flex flex-row gap-1 relative left-2 bottom-3'}>
                    <FontAwesomeIcon icon={faCircle} className={`opacity-${opacity[0]}`}/>
                    <FontAwesomeIcon icon={faCircle} className={`opacity-${opacity[1]}`}/>
                    <FontAwesomeIcon icon={faCircle} className={`opacity-${opacity[2]}`}/>
                </div>

                <form onSubmit={(e) => sendMessage(e)} className='flex flex-row w-full gap-2 items-center'>
                    <input
                        type="text"
                        value={currentMsg}
                        placeholder="Envoyer un message dans permanence"
                        spellCheck={true}
                        onChange={(e) => {
                            setCurrentMsg(e.target.value)
                            sendTyping()
                        }}
                        className="w-full flex flex-row outline-main outline-1 p-2 rounded-lg"
                        data-ms-editor="true"
                    />
                    <FontAwesomeIcon icon={faFaceSmileWink} width={32} onClick={() => {
                        if (emojiOpen) setEmojiOpen(false);
                        else setEmojiOpen(true);
                    }} className={emojiOpen ? 'cursor-pointer text-main' : 'cursor-pointer'}/>
                    <button className='cursor-pointer'><FontAwesomeIcon icon={faPaperPlane} width={32}/></button>
                </form>
            </div>
        </div>
    );
}