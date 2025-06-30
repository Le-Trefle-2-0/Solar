"use client";
import Image from "next/image";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCircle} from "@fortawesome/free-solid-svg-icons";
import GifPicker from "gif-picker-react";
import EmojiPicker, {EmojiStyle} from "emoji-picker-react";
import {
    Bot,
    Check,
    ChevronsUpDown,
    Laugh,
    MessageCircleOff,
    PhoneCall,
    Send,
    TvMinimalPlay,
    UserRoundPlus
} from "lucide-react";
import {FormEvent, useEffect, useRef, useState} from "react";
import {Msg} from "@/lib/interface";
import {z, ZodError} from "zod";
import {toast} from "sonner";
import {saveMessage} from "@/lib/messageManager";
import {useSession} from "@/lib/auth-client";
import {io, Socket} from "socket.io-client";
import Peer from "peerjs";
import {Button} from "@/components/ui";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import {cn} from "@/lib/utils"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,} from "@/components/ui/command"
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form"
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover"

export function Chat(props: { channelID: string }) {
    const channelID = props.channelID;
    const {data: session} = useSession();
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [gifOpen, setGifOpen] = useState(false);
    const [showTyping, setShowTyping] = useState(false);
    const [currentMsg, setCurrentMsg] = useState("");
    const [channelName, setChannelName] = useState("le chat");
    const [chat, setChat] = useState<Msg[]>([])
    const formRef = useRef<HTMLFormElement>(null);
    const textRef = useRef<HTMLTextAreaElement>(null);
    const rootDivRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const messagesListRef = useRef<HTMLDivElement>(null);
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const callingVideoRef = useRef<HTMLVideoElement>(null);
    const [peerInstance, setPeerInstance] = useState<Peer | null>(null);
    const [idToCall, setIdToCall] = useState('');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [callColor, setCallColor] = useState<string>("#000");

    const messageSchema = z
        .string()
        .max(2000, "Votre message est trop long")
        .refine((val) => val.trim().length >= 1, {
            message: "Contenu du message non supporté",
        });


    const sendMessage = (content: string) => {
        const msg: Msg = {
            author: {
                id: session?.user.id as string,
                name: session?.user.displayUsername as string || session?.user.name as string,
                image: session?.user.image as string,
                role: session?.user.role as string,
            },
            timestamp: Date.now(),
            channel: {
                id: channelID,
            },
            content
        }

        saveMessage(msg)
        socketRef.current?.emit("sendMessage", msg);
        setChat((pre) => [...pre, msg])
    }

    const sendForm = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            messageSchema.parse(currentMsg);
        } catch (error) {
            if (error instanceof ZodError) {
                return toast.error(error.errors[0].message);
            }
        }
        if (currentMsg !== "") {
            sendMessage(currentMsg);
            setCurrentMsg("");
        }
    }

    const sendTyping = async () => {
        await socketRef.current?.emit('typing', {id: channelID});
    }

    const handleCall = async () => {
        if (peerInstance) {
            peerInstance.disconnect();
            setPeerInstance(null);
            setCallColor("#000")
        } else {
            navigator.mediaDevices.getUserMedia({video: false, audio: true})
                .then(stream => {
                    if (myVideoRef.current) {
                        myVideoRef.current.srcObject = stream;
                    }
                    const callID = Math.random().toString(36).substring(2);
                    const peer = new Peer(callID, {
                        host: process.env.NEXT_PUBLIC_HOST,
                        port: 9000,
                        path: '/',
                        secure: true
                    });
                    setPeerInstance(peer);

                    peer.on('call', call => {
                        call.answer(stream);

                        setCallColor("#5de03a")
                        call.on('stream', userVideoStream => {
                            if (callingVideoRef.current) {
                                callingVideoRef.current.srcObject = userVideoStream;
                            }
                        });
                    });

                    setCallColor("#e0c43a")

                    sendMessage(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/webrtc/${callID}`)
                })
                .catch(error => {
                    console.error("Error accessing media devices:", error);
                    alert("Please allow access to the camera and microphone to use this feature.");
                });
        }
    };

    useEffect(() => {
        fetch(`/api/messages/${channelID}`)
            .then(res => res.json())
            .then(data => {
                setChat(data)
                messagesListRef.current?.scrollIntoView()
            });
        fetch(`/api/channel/${channelID}`)
            .then(res => res.json())
            .then(data => {
                setChannelName(data.name)
            })
        fetch("/api/auth/token").then(async res => {
            const body = await res.json();
            if (body.token) {
                socketRef.current = io(process.env.NEXT_PUBLIC_APP_URL, {
                    auth: {
                        jwt: body.token
                    },
                    transports: ['websocket'],
                    withCredentials: true,
                    rejectUnauthorized: (process.env.NODE_ENV == 'production')
                });

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

                socketRef.current?.emit('listen', {id: channelID})
            }
        })
        rootDivRef.current?.focus();

        return () => {
        }
    }, []);

    const nonChar = [
        // Navigation
        "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
        "Home", "End", "PageUp", "PageDown",

        // Control & UI
        "Escape", "Enter", "Tab",
        "ContextMenu", "PrintScreen", "Pause", "ScrollLock",

        // Modifier keys
        "Alt", "AltGraph", "CapsLock", "Control", "Fn", "FnLock",
        "Meta", "Shift", "NumLock", "Symbol", "SymbolLock", "Hyper",

        // Function keys
        "F1", "F2", "F3", "F4", "F5", "F6",
        "F7", "F8", "F9", "F10", "F11", "F12",
        "Soft1", "Soft2", "Soft3", "Soft4",

        // Editing keys
        "Clear",
        "Copy",

        // Media keys
        "MediaPlay", "MediaPause", "MediaStop",
        "MediaTrackNext", "MediaTrackPrevious", "MediaSelect",

        // Audio controls
        "VolumeMute", "VolumeDown", "VolumeUp",
        "AudioVolumeMute", "AudioVolumeDown", "AudioVolumeUp",

        // App launch
        "LaunchMail", "LaunchMediaPlayer",

        // Speech-related
        "SpeechToggle", "SpeechDictation",

        // Numpad keys (non-textual)
        "NumpadEnter",
        "NumpadAdd", "NumpadSubtract", "NumpadMultiply", "NumpadDivide",
        "NumpadDecimal",
        "NumpadEqual",
        "NumpadParenLeft", "NumpadParenRight",
        "NumpadMemoryAdd", "NumpadMemoryClear", "NumpadMemoryRecall",
        "NumpadMemoryStore", "NumpadMemorySubtract",

        // Misc
        "Help", "Insert", "Clear",

        // Unidentified
        "Unidentified"
    ];

    const tenorGifRegex = /^https:\/\/media\.tenor\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.gif$/;

    const FormSchema = z.object({
        volunteer: z.string({
            required_error: "Merci de sélectionner un Bénévole Écoutant",
        }),
    });

    const available = [
        {label: "BE1", value: "ID1"},
        {label: "BE2", value: "ID2"},
    ] as const

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });

    function onSubmit(data: z.infer<typeof FormSchema>) {
        toast("You submitted the following values", {
            description: (
                <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
            ),
        })
    }

    return (
        <div className="flex flex-col h-screen p-3 gap-4 w-full" onKeyDown={(e) => {
            if (!nonChar.includes(e.key) && !gifOpen) {
                textRef.current?.focus();
            }
        }} tabIndex={0} ref={rootDivRef}>
            <video className='w-0 h-0' playsInline ref={callingVideoRef} autoPlay/>
            <div className="flex flex-col flex-grow overflow-y-auto gap-6">
                {chat.map(({author, content, timestamp}, key) => {
                    const showAuthorInfo = key === 0 || chat[key - 1].author.id !== author.id;

                    return (
                        <div className="w-full flex flex-row gap-2" key={key}>
                            {showAuthorInfo && (
                                <Image
                                    src={author.image ? author.image : '/logo.svg'}
                                    alt="Image de profil"
                                    width={48}
                                    height={48}
                                    className="rounded-xl max-h-[48px]"
                                />
                            )}
                            <div className={!showAuthorInfo ? "ml-14" : ""}>
                                {showAuthorInfo && (
                                    <div className="flex flex-row items-center gap-4">
                        <span
                            className={
                                author.role === 'bot'
                                    ? "font-semibold text-sm text-blue-800 flex flex-row gap-3"
                                    : "font-semibold text-sm text-gray-900 flex flex-row gap-3"
                            }
                        >
                            {author.name}
                            {author.role === "bot" && <Bot className="-translate-y-1"/>}
                        </span>
                                        <span className="font-light text-sm text-gray-900">
                            {new Date(timestamp).toLocaleString('fr-FR')}
                        </span>
                                    </div>
                                )}
                                <h3 className="text-lg text-gray-900 whitespace-pre-wrap break-words max-w-full">
                                    {tenorGifRegex.test(content) ? (
                                        <Image
                                            src={content}
                                            alt="gif"
                                            height={256}
                                            width={256}
                                            unoptimized
                                        />
                                    ) : (
                                        content
                                    )}
                                </h3>
                            </div>
                        </div>
                    );
                })}



                <div ref={messagesListRef} className="h-px"/>
            </div>
            <div className={showTyping ? 'flex flex-row gap-1 relative left-2 bottom-3' : 'hidden'}>
                <FontAwesomeIcon icon={faCircle} className="text-gray-400 animate-opacityPulse1"/>
                <FontAwesomeIcon icon={faCircle} className="text-gray-400 animate-opacityPulse2"/>
                <FontAwesomeIcon icon={faCircle} className="text-gray-400 animate-opacityPulse3"/>
            </div>

            {channelID !== "1" ?
                <div className="fixed top-6 right-6 flex flex-row gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline">
                                <UserRoundPlus/> Attribuer
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Merci de choisir le bénévole à attribuer</AlertDialogTitle>
                            </AlertDialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="volunteer"
                                        render={({field}) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Bénévole Écoutant</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className={cn(
                                                                    "w-[350px] justify-between",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value
                                                                    ? available.find(
                                                                        (available) => available.value === field.value
                                                                    )?.label
                                                                    : "Sélectionner le bénévole"}
                                                                <ChevronsUpDown className="opacity-50"/>
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[350px] p-0">
                                                        <Command>
                                                            <CommandInput
                                                                placeholder="Rechercher un bénévole..."
                                                                className="h-9"
                                                            />
                                                            <CommandList>
                                                                <CommandEmpty>Aucun bénévole trouvé</CommandEmpty>
                                                                <CommandGroup>
                                                                    {available.map((available) => (
                                                                        <CommandItem
                                                                            value={available.label}
                                                                            key={available.value}
                                                                            onSelect={() => {
                                                                                form.setValue("volunteer", available.value)
                                                                            }}
                                                                        >
                                                                            {available.label}
                                                                            <Check
                                                                                className={cn(
                                                                                    "ml-auto",
                                                                                    available.value === field.value
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0"
                                                                                )}
                                                                            />
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                <FormDescription>
                                                    Le bénévole aura ensuite accès à l'écoute
                                                </FormDescription>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <Button type="submit">Submit</Button>
                                    </AlertDialogFooter>
                                </form>
                            </Form>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Button variant='outline' color={callColor} onClick={handleCall}>
                        <PhoneCall color={callColor}/> Démarrer un vocal
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <MessageCircleOff/> Fermer l'écoute
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Attention, êtes vous certain ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    La fermeture d'une écoute est irréversible. Pour simplement retourner au chat de
                                    permanence merci d'utiliser l'onglet latéral.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction>Fermer l'écoute</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div> : null
            }

            <div className="sticky bottom-0">
                <div className={gifOpen ? "block absolute right-2 bottom-15" : "hidden"}>
                    <GifPicker tenorApiKey={"AIzaSyDUnTsv0aerH1JSzXRmKTVrpx3YEz3e_RM"} onGifClick={(gif) => {
                        sendMessage(gif.url)
                        setGifOpen(false);
                    }}/>
                </div>
                <div className="absolute right-2 bottom-15">
                    <EmojiPicker emojiStyle={EmojiStyle.TWITTER} onEmojiClick={(emoji) => {
                        setCurrentMsg(currentMsg + ' ' + emoji.emoji);
                        setEmojiOpen(false);
                        textRef.current?.focus();
                    }} open={emojiOpen}/>
                </div>

                <form ref={formRef} onSubmit={(e) => sendForm(e)}
                      className='flex flex-row w-full gap-2 items-center'>
                    <textarea
                        placeholder={`Envoyer un message dans ${channelName}`}
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
                    <Laugh onClick={() => {
                        if (emojiOpen) setEmojiOpen(false);
                        else {
                            setEmojiOpen(true);
                            if (gifOpen) setGifOpen(false);
                        }
                    }} className={emojiOpen ? 'cursor-pointer text-main' : 'cursor-pointer'} width={42}/>

                    <TvMinimalPlay onClick={() => {
                        if (gifOpen) setGifOpen(false);
                        else {
                            setGifOpen(true);
                            if (emojiOpen) setEmojiOpen(false);
                        }
                    }} className={gifOpen ? 'cursor-pointer text-main' : 'cursor-pointer'} width={42}/>
                    <button className='cursor-pointer'><Send width={42}/></button>
                </form>
            </div>
        </div>
    );
}