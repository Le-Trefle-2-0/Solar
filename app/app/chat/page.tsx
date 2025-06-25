"use client";
import {FormEvent, useEffect, useRef, useState} from "react";
import {useSession} from "@/lib/auth-client";
import Image from "next/image";
import {Msg} from "@/lib/interface"
import {saveMessage} from "@/lib/messageManager";
import EmojiPicker, {EmojiStyle} from 'emoji-picker-react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faFaceSmileWink, faPaperPlane} from "@fortawesome/free-regular-svg-icons";
import {faCircle} from "@fortawesome/free-solid-svg-icons";
import {z, ZodError} from "zod";
import {toast} from "sonner";
import {io, Socket} from "socket.io-client";

export default function MainChat() {
    const {data: session} = useSession();
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
    const socketRef = useRef<Socket | null>(null);
    const messagesListRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesListRef.current?.scrollIntoView({behavior: "instant", block: "end"});
    };

    useEffect(() => {
        fetch('/api/messages/1')
            .then(res => res.json())
            .then(data => {
                setChat(data)
                scrollToBottom()
            });
        fetch("/api/auth/token").then(async res => {
            const body = await res.json();
            if (body.token) {
                socketRef.current = io({
                    auth: {
                        jwt: body.token
                    }
                });
                if (socketRef.current?.connected) {
                    onConnect();
                }

                function onConnect() {
                    setIsConnected(true);
                    setTransport(socketRef.current?.io.engine.transport.name as string);

                    socketRef.current?.io.engine.on("upgrade", (transport) => {
                        setTransport(transport.name);
                    });
                }

                function onDisconnect() {
                    setIsConnected(false);
                    setTransport("N/A");
                }

                socketRef.current?.on("connect", onConnect);
                socketRef.current?.on("disconnect", onDisconnect);
                socketRef.current?.on("message", (data: Msg) => {
                    setChat((pre) => [...pre, data])
                });

                let timer: NodeJS.Timeout;
                socketRef.current?.on('typingIndicator', () => {
                    setShowTyping(true);
                    if (timer) clearTimeout(timer);
                    timer = setTimeout(() => {
                        setShowTyping(false);
                    }, 5000)
                });

                socketRef.current?.emit('listen', {id: '1'})
            }
        })
        rootDivRef.current?.focus();

        return () => {
        }
    }, []);

    const messageSchema = z
        .string()
        .max(2000, "Votre message est trop long")
        .refine((val) => val.trim().length >= 1, {
            message: "Contenu du message non supporté",
        });

    useEffect(() => {
    }, []);
    let oldMsg = currentMsg;

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
                    id: session?.user.id as string,
                    name: session?.user.displayUsername as string || session?.user.name as string,
                    image: session?.user.image as string
                },
                content: currentMsg,
                timestamp: Date.now(),
                channel: {
                    id: '1'
                }
            }

            saveMessage(msg)
            socketRef.current?.emit("sendMessage", msg);
            setCurrentMsg("");
            setChat((pre) => [...pre, msg])
        }
    }

    const sendTyping = async () => {
        await socketRef.current?.emit('typing', {id: '1'});
    }

    return (
        <div className="flex flex-col h-screen p-3 gap-4 w-full" onKeyDown={(e) => {
            if (e.key !== "Enter") {
                textRef.current?.focus();
            }
        }} tabIndex={0} ref={rootDivRef}>
            <div className="flex flex-col flex-grow overflow-y-auto gap-6">
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
                <div ref={messagesListRef} className="h-px"/>
            </div>
            <div className={showTyping ? 'flex flex-row gap-1 relative left-2 bottom-3' : 'hidden'}>
                <FontAwesomeIcon icon={faCircle} className="text-gray-400 animate-opacityPulse1"/>
                <FontAwesomeIcon icon={faCircle} className="text-gray-400 animate-opacityPulse2"/>
                <FontAwesomeIcon icon={faCircle} className="text-gray-400 animate-opacityPulse3"/>
            </div>

            <div className="sticky bottom-0">
                <div className="absolute right-2 bottom-15">
                    <EmojiPicker emojiStyle={EmojiStyle.TWITTER} onEmojiClick={(emoji) => {
                        setCurrentMsg(currentMsg + ' ' + emoji.emoji);
                        setEmojiOpen(false);
                        textRef.current?.focus();
                    }} open={emojiOpen}/>
                </div>

                <form ref={formRef} onSubmit={(e) => sendMessage(e)}
                      className='flex flex-row w-full gap-2 items-center'>
                    <textarea
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
                        spellCheck="true"
                        data-ms-editor="true"
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