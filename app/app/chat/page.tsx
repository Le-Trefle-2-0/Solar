"use client";

import {FormEvent, useEffect, useRef, useState} from "react";
import {socket} from "@/socket";
import {authClient} from "@/lib/auth-client";
import Image from "next/image";
import {Msg} from "@/lib/interface"
import {saveMessage} from "@/lib/messageManager";
import EmojiPicker, {EmojiStyle} from 'emoji-picker-react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faFaceSmileWink, faPaperPlane} from "@fortawesome/free-regular-svg-icons";
import {faCircle} from "@fortawesome/free-solid-svg-icons";
import {Textarea} from "@/components/ui/textarea";
import {z, ZodError} from "zod";
import {toast} from "sonner";

export default function Chat() {
    const session = authClient.useSession();
    const [isConnected, setIsConnected] = useState(false);
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [showTyping, setShowTyping] = useState(false);
    const [transport, setTransport] = useState("N/A");
    const [currentMsg, setCurrentMsg] = useState("");
    const [chat, setChat] = useState<Msg[]>([])
    const [opacity, setOpacity] = useState(25);
    const formRef = useRef<HTMLFormElement>(null);
    const textRef = useRef<HTMLTextAreaElement>(null);
    const rootDivRef = useRef<HTMLDivElement>(null);

    const messageSchema = z
        .string()
        .max(2000, "Votre message est trop long")
        .refine((val) => val.trim().length >= 1, {
            message: "Contenu du message non supporté",
        });

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

        try {
            messageSchema.parse(currentMsg);
        } catch (error) {
            if (error instanceof ZodError) {
                return toast.error(error.errors[0].message);
            }
        }
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

    useEffect(() => {
        rootDivRef.current?.focus();
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
        socket.on('typingIndicator', () => {
        });

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, []);

    return (
        <div onKeyDown={(e) => {
            if (e.key !== "Enter") {
                textRef.current?.focus();
            }
        }} tabIndex={0} ref={rootDivRef}>
            <div className="flex flex-col justify-between h-screen p-3 gap-4">
                <div className="flex flex-col justify-end h-screen gap-6 overflow-auto">
                    {chat.map(({author, content, timestamp}, key) => (
                        <div className="w-full flex flex-row gap-2" key={key}>
                            <Image src={(author.image ? author.image : '/logo.svg')} alt="Image de profil" width={48}
                                   height={48} className="rounded-xl max-h-[48px]"/>
                            <div>
                                <div className="flex flex-row items-center gap-4">
                                    <span className="font-semibold text-sm text-gray-900">
                                        {author.name}
                                    </span>
                                    <span className="font-light text-sm text-gray-900">
                                        {new Date(timestamp).toLocaleString('fr-FR')}
                                    </span>
                                </div>
                                <h3 className="text-lg text-gray-900 whitespace-pre-wrap">
                                    {content}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute right-2 bottom-15">
                    <EmojiPicker emojiStyle={EmojiStyle.TWITTER} onEmojiClick={(emoji) => {
                        setCurrentMsg(currentMsg + ' ' + emoji.emoji);
                        setEmojiOpen(false);
                        textRef.current?.focus();
                    }} open={emojiOpen}/>
                </div>
                <div className={showTyping ? 'flex flex-row gap-1 relative left-2 bottom-3' : 'hidden'}>
                    <FontAwesomeIcon icon={faCircle} className={`opacity-${opacity}`}/>
                    <FontAwesomeIcon icon={faCircle} className={`opacity-${opacity}`}/>
                    <FontAwesomeIcon icon={faCircle} className={`opacity-${opacity}`}/>
                </div>

                <form ref={formRef} onSubmit={(e) => sendMessage(e)}
                      className='flex flex-row w-full gap-2 items-center'>
                    <Textarea
                        placeholder="Envoyer un message dans permanence"
                        onChange={(e) => {
                            setCurrentMsg(e.target.value)
                            sendTyping()
                        }}
                        ref={textRef}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                formRef.current?.requestSubmit();
                            }
                        }}
                        value={currentMsg}
                        className="w-full flex flex-row outline-main outline-1 p-2 rounded-lg resize-none"
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