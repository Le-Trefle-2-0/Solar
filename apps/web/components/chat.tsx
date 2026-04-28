"use client";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCircle} from "@fortawesome/free-solid-svg-icons";
import GifPicker from "gif-picker-react";
import {EmojiPicker, EmojiPickerContent, EmojiPickerFooter, EmojiPickerSearch,} from "@/components/ui/emoji-picker";
import {
    Check,
    ChevronsUpDown,
    CircleAlert,
    Copy,
    IdCardLanyard,
    Info,
    Laugh,
    MessageCircleOff,
    MicOff,
    NotebookPen,
    PhoneCall,
    ScanFace,
    Send,
    TvMinimalPlay,
    UserRoundPlus,
    UserRoundX,
    X
} from "lucide-react";
import React, {FormEvent, useEffect, useLayoutEffect, useRef, useState} from "react";
import {EventData, Msg, MsgWithID, ticketInfo} from "@/lib/interface";
import {z, ZodError} from "zod";
import {toast} from "sonner";
import {saveMessage} from "@/lib/messageManager";
import {useSession} from "@/lib/auth-client";
import {Socket} from "socket.io-client";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Badge,
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Skeleton,
    Textarea,
    useSidebar
} from "@/components/ui";
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
import {ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger} from "@/components/ui/context-menu"
import type {Reaction, Ticket} from "@prisma/client"
import {useRouter} from "next/navigation";
import {Message} from "@/components/message";
import {useSocket} from "@/context/Socket";
import {usePeer} from "@/context/VoicePeer";
import {VisuallyHidden} from "@radix-ui/react-visually-hidden";
import {apiFetch} from "@/lib/api";

export function Chat(props: { channelID: string, statusID: number }) {
    const {channelID, statusID} = props;
    const [status, setStatus] = useState(statusID);
    const {data: session} = useSession();
    const {socket, setChannelID} = useSocket();
    const router = useRouter();
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [ticketInfo, setTicketInfo] = useState<ticketInfo>();
    const [gifOpen, setGifOpen] = useState(false);
    const [showTyping, setShowTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState<{ id: string; name: string; image: string | null }[]>([]);
    const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const lastTypingSentRef = useRef<number>(0);
    const [ticket, setTicket] = useState<Ticket>();
    const [currentMsg, setCurrentMsg] = useState("");
    const [channelName, setChannelName] = useState("le chat");
    const [replyTo, setReplyTo] = useState<{
        id: number;
        authorName: string;
        content: string;
        timestamp: number
    } | null>(null);
    const [chat, setChat] = useState<MsgWithID[]>([])
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(true)
    const [retryMs, setRetryMs] = useState(1000)
    const [skeletonItems, setSkeletonItems] = useState<{ nameW: number; line1W: number; line2W: number }[]>([])
    const INITIAL_LIMIT = 60
    const [hasMore, setHasMore] = useState(true)
    const [loadingOlder, setLoadingOlder] = useState(false)
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const formRef = useRef<HTMLFormElement>(null);
    const textRef = useRef<HTMLTextAreaElement>(null);
    const rootDivRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const messagesListRef = useRef<HTMLDivElement>(null);
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const callingVideoRef = useRef<HTMLVideoElement>(null);
    const [idToCall, setIdToCall] = useState('');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [available, setAvailable] = useState<formVolunteer[]>([]);
    const [ineligibleText, setIneligibleText] = useState<string[]>([]);
    const [ineligibleVoice, setIneligibleVoice] = useState<string[]>([]);
    const {toggleSidebar} = useSidebar();
    const [canManageMessages, setCanManageMessages] = useState(false);
    const [eventInfo, setEventInfo] = useState<EventData | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(false);
    const [eventDialogOpen, setEventDialogOpen] = useState(false);

    const fetchEventInfo = async () => {
        setLoadingEvent(true);
        try {
            const res = await apiFetch(`/v1/events/channel/${channelID}`);
            if (res.success && res.event) {
                setEventInfo(res.event);
            } else {
                setEventInfo(null);
            }
        } catch (e) {
            console.error("Failed to fetch event info:", e);
            setEventInfo(null);
        } finally {
            setLoadingEvent(false);
        }
    };

    const myAudioRef = useRef<HTMLAudioElement>(null);

    // LanguageTool (French) spellcheck state for chat input
    const [ltMatches, setLtMatches] = useState<{
        offset: number;
        length: number;
        message: string;
        replacements?: string[]
    }[]>([]);
    const [highlightHtml, setHighlightHtml] = useState<string>("");
    const ltAbortRef = useRef<AbortController | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const [ctxData, setCtxData] = useState<{ offset: number; length: number; suggestions: string[] }>({
        offset: 0,
        length: 0,
        suggestions: []
    });
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const initialAutoScrollPending = useRef(false);
    const isAtBottomRef = useRef(true);

    // Escape HTML to safely build overlay content
    const escapeHtml = (s: string) => s
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

    // Build highlighted HTML using LanguageTool matches (underline errors)
    const buildHighlightHtml = (text: string, matches: { offset: number; length: number; message: string }[]) => {
        if (!text) return "";
        const safe = escapeHtml(text);
        if (!matches || matches.length === 0) return safe;
        // Map through original indices; since we escaped, indices still align as we only replaced single chars
        let result = "";
        let cursor = 0;
        // Merge overlapping matches and sort
        const sorted = [...matches]
            .filter(m => m.length > 0)
            .sort((a, b) => a.offset - b.offset);
        const merged: { offset: number; length: number; message: string }[] = [];
        for (const m of sorted) {
            if (merged.length === 0) {
                merged.push({...m});
                continue;
            }
            const last = merged[merged.length - 1];
            const lastEnd = last.offset + last.length;
            if (m.offset <= lastEnd) {
                // overlap, extend
                const newEnd = Math.max(lastEnd, m.offset + m.length);
                merged[merged.length - 1] = {offset: last.offset, length: newEnd - last.offset, message: last.message};
            } else {
                merged.push({...m});
            }
        }
        for (const m of merged) {
            const start = m.offset;
            const end = m.offset + m.length;
            if (start > safe.length) break;
            if (cursor < start) result += safe.slice(cursor, start);
            const frag = safe.slice(start, Math.min(end, safe.length));
            result += `<span class="lt-err" data-offset="${start}" data-length="${m.length}" title="${escapeHtml(m.message)}">${frag}</span>`;
            cursor = end;
        }
        if (cursor < safe.length) result += safe.slice(cursor);
        return result;
    };

    // Throttled + debounced scheduling for LanguageTool checks
    const [ltQuery, setLtQuery] = useState<string>("");
    const lastCheckAtRef = useRef<number>(0);
    const lastCheckedTextRef = useRef<string>("");
    useEffect(() => {
        // Clear on empty or very short inputs
        if (!currentMsg || currentMsg.trim().length < 4) {
            setLtMatches([]);
            setHighlightHtml("");
            setLtQuery("");
            return;
        }
        const now = Date.now();
        const minInterval = 1200; // throttle: at most ~1.2s
        const idleDelay = 800; // debounce after pause
        const prev = lastCheckedTextRef.current;
        const delta = Math.abs(currentMsg.length - prev.length);
        const significantChange = delta >= 5 || /[\s\.,;:!?]$/.test(currentMsg);

        // Immediate check if throttled interval passed and change significant
        if (now - lastCheckAtRef.current > minInterval && significantChange) {
            lastCheckAtRef.current = now;
            lastCheckedTextRef.current = currentMsg;
            setLtQuery(currentMsg);
            return;
        }
        // Debounced check after user pauses typing
        const t = setTimeout(() => {
            lastCheckAtRef.current = Date.now();
            lastCheckedTextRef.current = currentMsg;
            setLtQuery(currentMsg);
        }, idleDelay);
        return () => clearTimeout(t);
    }, [currentMsg]);

    // LanguageTool API call driven by ltQuery (not every keystroke)
    useEffect(() => {
        if (!ltQuery) return;
        (async () => {
            try {
                if (ltAbortRef.current) ltAbortRef.current.abort();
                const controller = new AbortController();
                ltAbortRef.current = controller;
                const params = new URLSearchParams();
                params.set("language", "fr");
                params.set("text", ltQuery);
                const res = await fetch("https://api.languagetool.org/v2/check", {
                    method: "POST",
                    headers: {"Content-Type": "application/x-www-form-urlencoded"},
                    body: params.toString(),
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error("LanguageTool API error");
                const data = await res.json();
                const matches = (data.matches || []).map((m: any) => ({
                    offset: m.offset as number,
                    length: m.length as number,
                    message: typeof m.message === "string" ? m.message : "Erreur détectée",
                    replacements: Array.isArray(m.replacements) ? m.replacements.map((r: any) => r.value).filter(Boolean) : [],
                }));
                // Avoid applying stale results to newer text
                if (ltQuery === currentMsg) {
                    setLtMatches(matches);
                }
            } catch (e) {
                if ((e as any)?.name === "AbortError") return;
                setLtMatches([]);
            }
        })();
    }, [ltQuery, currentMsg]);

    // Rebuild highlight HTML when text or matches change
    useEffect(() => {
        setHighlightHtml(buildHighlightHtml(currentMsg, ltMatches));
    }, [currentMsg, ltMatches]);

    // Mirror textarea's computed styles into the overlay to ensure exact underline placement
    useLayoutEffect(() => {
        const ta = textRef.current;
        const ov = overlayRef.current;
        if (!ta || !ov) return;

        const sync = () => {
            const cs = window.getComputedStyle(ta);
            const props = [
                "fontFamily",
                "fontSize",
                "fontWeight",
                "fontStyle",
                "letterSpacing",
                "textTransform",
                "textIndent",
                "wordSpacing",
                "lineHeight",
                "paddingTop",
                "paddingRight",
                "paddingBottom",
                "paddingLeft",
                "boxSizing",
                "tabSize",
            ] as const;
            props.forEach((p) => {
                // @ts-ignore - dynamic style copy
                ov.style[p] = (cs as any)[p] || "";
            });
            // Ensure wrapping behavior matches textarea
            ov.style.whiteSpace = "pre-wrap";
        };

        sync();
        const ro = new ResizeObserver(() => sync());
        ro.observe(ta);
        window.addEventListener("resize", sync);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", sync);
        };
    }, []);


    const messageSchema = z
        .string()
        .max(2000, "Votre message est trop long")
        .refine((val) => val.trim().length >= 1, {
            message: "Contenu du message non supporté",
        });


    const sendMessage = async (content: string) => {
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
            discordID: null,
            reactions: [],
            content,
            replyID: replyTo?.id ?? null,
        };

        try {
            const savedMessage = await saveMessage(msg);
            const msgWithID: MsgWithID = {
                ...msg,
                id: savedMessage.id,
                replyID: msg.replyID ?? null,
            };

            socket?.emit("sendMessage", msgWithID);
            isAtBottomRef.current = true;
            setChat((pre) => {
                if (savedMessage.id && pre.some(m => m.id === savedMessage.id)) return pre;
                return [...pre, msgWithID];
            });
        } catch (error) {
            console.error("Error saving message:", error);
        }
    };

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
            setReplyTo(null);
        }
    }

    const sendTyping = async () => {
        const now = Date.now();
        if (now - (lastTypingSentRef.current || 0) < 1500) return;
        lastTypingSentRef.current = now;
        await socket?.emit('typing', {
            id: channelID,
            user: {
                id: session?.user.id,
                name: (session?.user.displayUsername as string) || (session?.user.name as string),
                image: session?.user.image as string | null,
            }
        });
    }

    const {peerInstance, callColor, startCall, stopCall} = usePeer();

    const handleCall = () => {
        if (peerInstance) {
            stopCall();
        } else {
            startCall(myAudioRef, remoteAudioRef);
        }
    };

    type UserFromList = {
        id: string;
        username: string;
        image: string | null;
        role: string | string[];
    };

    const [onlineUsers, setOnlineUsers] = useState<UserFromList[]>([]);
    const [allMembers, setAllMembers] = useState<UserFromList[]>([]);

    const roleOrder = ['admin', 'bot', 'manager', 'volunteer', 'training'] as const;
    const getHighestRole = (role: string | string[] | undefined | null): string => {
        const toKey = (r: string) => (r || '').toLowerCase();
        if (!role) return 'training';
        if (Array.isArray(role)) {
            // pick the role with the LOWEST index (admin highest rank)
            const normalized = role.map(r => toKey(r as any)).filter(r => (roleOrder as readonly string[]).includes(r));
            if (normalized.length === 0) return 'training';
            let best = normalized[0];
            for (const r of normalized) {
                if ((roleOrder as readonly string[]).indexOf(r) < (roleOrder as readonly string[]).indexOf(best)) {
                    best = r;
                }
            }
            return best;
        }
        const r = toKey(role as string);
        return (roleOrder as readonly string[]).includes(r) ? r : 'training';
    };


    useEffect(() => {
        if (!socket) return;

        let timer: NodeJS.Timeout;
        let pollId: NodeJS.Timeout | null = null;

        const ensureSelfIncluded = (users: UserFromList[]): UserFromList[] => {
            if (!session?.user) return users;
            const me: UserFromList = {
                id: session.user.id as string,
                username: (session.user.displayUsername as string) || (session.user.name as string),
                image: (session.user.image as string) || null,
                role: getHighestRole(session.user.role as any),
            };
            return users.some(u => u.id === me.id) ? users : [...users, me];
        };

        const requestSnapshot = () => {
            if (!socket) return;
            socket.emit('getOnlineUsers', {channelID}, (users: UserFromList[]) => {
                const normalized = (users || []).map(u => ({...u, role: getHighestRole(u.role as any)}));
                setOnlineUsers(ensureSelfIncluded(normalized));
            });
        };

        const handleConnect = () => {
            if (!socket) return;
            requestSnapshot();
            // Also refresh members list to ensure consistency
            apiFetch(`/v1/channel/${channelID}/members`)
                .then((res: any) => {
                    if (res.success && res.members) {
                        setAllMembers(res.members.map((u: any) => ({...u, role: getHighestRole(u.role)})));
                    }
                }).catch(() => {
            });
        }

        // initial snapshot
        handleConnect();

        function handleUserList(users: UserFromList[]) {
            const normalized = (users || []).map(u => ({...u, role: getHighestRole(u.role as any)}));
            setOnlineUsers(ensureSelfIncluded(normalized));
        }

        socket.on("userList", handleUserList);

        const handleJoined = (payload: { channelId: string; user: UserFromList }) => {
            if (payload?.channelId === channelID && payload.user) {
                const normalizedUser = {...payload.user, role: getHighestRole(payload.user.role as any)};
                setOnlineUsers(prev => {
                    const exists = prev.some(u => u.id === normalizedUser.id);
                    return exists ? prev : [...prev, normalizedUser];
                });
            }
        };
        const handleLeft = (payload: { channelId: string; user: UserFromList }) => {
            if (payload?.channelId === channelID && payload.user) {
                setOnlineUsers(prev => prev.filter(u => u.id !== payload.user.id));
            }
        };

        socket.on("userJoined", handleJoined);
        socket.on("userLeft", handleLeft);

        const onMessage = (data: Msg) => {
            if (data.channel.id === channelID) {
                setChat((pre) => {
                    const exists = (data as MsgWithID).id && pre.some(m => m.id === (data as MsgWithID).id);
                    if (exists) return pre;
                    return [...pre, data as MsgWithID];
                })
                if (timer) clearTimeout(timer)
            }
        };

        const onTyping = (data: any) => {
            if (data && data.user && data.id === channelID) {
                const u = data.user as { id: string; name: string; image: string | null };
                setTypingUsers(prev => {
                    const exists = prev.some(p => p.id === u.id);
                    const next = exists ? prev.map(p => p.id === u.id ? u : p) : [...prev, u];
                    return next;
                });
                setShowTyping(true);
                const timeouts = typingTimeoutsRef.current;
                if (timeouts.has(u.id)) clearTimeout(timeouts.get(u.id)!);
                const t = setTimeout(() => {
                    setTypingUsers(prev => {
                        const next = prev.filter(p => p.id !== u.id);
                        if (next.length === 0) setShowTyping(false);
                        return next;
                    });
                    const timeouts2 = typingTimeoutsRef.current;
                    timeouts2.delete(u.id);
                }, 5000);
                timeouts.set(u.id, t);
            } else {
                setShowTyping(true);
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => {
                    setShowTyping(false);
                }, 3000);
            }
        };

        const onReactionAdd = (data: any) => {
            console.log("REACTION ADD", data);
            setChat(prev =>
                prev.map(message => {
                    if (message.id === data.messageID) {
                        const reaction = data.reaction;
                        const existingReactions = message.reactions ?? [];
                        const existsById = existingReactions.some(r => r.id === reaction.id);
                        if (existsById) {
                            const updated = existingReactions.map(r => r.id === reaction.id ? reaction : r);
                            return {...message, reactions: updated};
                        }
                        const existsByUserEmoji = existingReactions.some(r => r.userID === reaction.userID && r.emoji === reaction.emoji);
                        if (existsByUserEmoji) {
                            const updated = existingReactions.map(r => (r.userID === reaction.userID && r.emoji === reaction.emoji) ? reaction : r);
                            return {...message, reactions: updated};
                        }
                        return {...message, reactions: [...existingReactions, reaction]};
                    }
                    return message;
                })
            );
        };

        const onMessageEdit = (data: { messageID: number; content: string; edited?: boolean }) => {
            setChat(prev => prev.map(m => m.id === data.messageID ? {
                ...m,
                content: data.content,
                edited: data.edited ?? true
            } : m));
        };

        const onStatusUpdate = (data: { channelId: string; statusId: number; statusName: string }) => {
            if (data.channelId === channelID) {
                setStatus(data.statusId);
                // Also update local ticket object if present
                setTicket(prev => prev ? {...prev, statusName: data.statusName} : prev);
            }
        };

        const onReactionRemove = (data: any) => {
            console.log("REACTION REMOVE", data);
            const {messageID, reactionID} = data;

            setChat(prev =>
                prev.map(message => {
                    if (message.id === messageID) {
                        const filteredReactions = (message.reactions ?? []).filter(
                            r => r.id !== reactionID
                        );

                        return {
                            ...message,
                            reactions: filteredReactions
                        };
                    }
                    return message;
                })
            );
        };

        const onMessageDelete = (data: { messageID: number }) => {
            setChat(prev => prev.filter(m => m.id !== data.messageID));
        };

        socket.on('joined', handleJoined);
        socket.on('left', handleLeft);

        socket.on('connect', handleConnect);
        socket.on('reconnect', handleConnect as any);
        socket.on('reconnect_attempt', requestSnapshot as any);

        // periodic reconciliation in case any event was missed
        pollId = setInterval(requestSnapshot, 10000);

        socket.on("message", onMessage);
        socket.on('typingIndicator', onTyping);
        socket.on('reactionAdd', onReactionAdd);
        socket.on('messageEdit', onMessageEdit);
        socket.on('ticketStatusUpdate', onStatusUpdate);
        socket.on('reactionRemove', onReactionRemove);
        socket.on('messageDelete', onMessageDelete);

        return () => {
            socket.off('userList', handleUserList);
            socket.off('userJoined', handleJoined);
            socket.off('userLeft', handleLeft);
            socket.off('connect', handleConnect);
            socket.off('reconnect', handleConnect as any);
            socket.off('reconnect_attempt', requestSnapshot as any);
            if (pollId) clearInterval(pollId);
            socket.off('message', onMessage);
            socket.off('reactionAdd', onReactionAdd);
            socket.off('reactionRemove', onReactionRemove);
            socket.off('typingIndicator', onTyping);
            socket.off('messageDelete', onMessageDelete);
            socket.off('messageEdit', onMessageEdit);
            socket.off('ticketStatusUpdate', onStatusUpdate);
        };
    }, [socket, channelID, session?.user]);

    useEffect(() => {
        let cancelled = false;
        let timer: NodeJS.Timeout | null = null;

        const load = async () => {
            if (cancelled) return;
            setLoadingMessages(true);
            setHasMore(true);
            setLoadingOlder(false);
            initialAutoScrollPending.current = true;
            try {
                apiFetch(`/v1/channel/${channelID}/members`)
                    .then((res: any) => {
                        if (res.success && res.members) {
                            setAllMembers(res.members.map((u: any) => ({...u, role: getHighestRole(u.role)})));
                        }
                    });

                const data: MsgWithID[] = await apiFetch(`/v1/messages/${channelID}?limit=${INITIAL_LIMIT}`);
                if (cancelled) return;
                setChat(data);
                setHasMore(Array.isArray(data) && data.length >= INITIAL_LIMIT);
                setLoadingMessages(false);
                setRetryMs(1000);

                // Fetch supplemental data after messages succeed (best-effort)
                apiFetch(`/v1/channel/${channelID}`)
                    .then((d) => {
                        if (!cancelled) setChannelName(d.name);
                    })
                    .catch(() => {
                    });

                if (status !== 0) {
                    apiFetch(`/v1/tickets/findBy/channelID`, {
                        method: "POST",
                        body: JSON.stringify({channelID}),
                    }).then((d) => {
                        if (!cancelled) setTicket(d.ticket);
                    }).catch(() => {
                    });
                }

                apiFetch(`/v1/admin/settings`)
                    .then((data: { settings: { key: string, value: string }[] }) => {
                        const catSetting = data.settings?.find(s => s.key === "monitoring_categories");
                        if (catSetting && !cancelled) {
                            try {
                                setAvailableCategories(JSON.parse(catSetting.value));
                            } catch (e) {
                                console.error("Failed to parse categories", e);
                            }
                        }
                    })
                    .catch(() => {
                    });

                apiFetch(`/v1/events/getAvailable?channelID=${channelID}`)
                    .then((d) => {
                        if (cancelled) return;
                        setAvailable([
                            ...d.map((user: { name: any; id: any; }) => ({
                                label: user.name,
                                value: {id: user.id, name: user.name},
                            }))
                        ]);
                    }).catch(() => {
                });

                apiFetch(`/v1/events/getAvailable?channelID=${channelID}&lists=ineligible`)
                    .then((d) => {
                        if (cancelled) return;
                        const textNames = Array.isArray(d?.ineligibleText) ? d.ineligibleText.map((u: any) => u.name).filter(Boolean) : [];
                        const voiceNames = Array.isArray(d?.ineligibleVoice) ? d.ineligibleVoice.map((u: any) => u.name).filter(Boolean) : [];
                        setIneligibleText(textNames);
                        setIneligibleVoice(voiceNames);
                    })
                    .catch(() => {
                        if (cancelled) return;
                        setIneligibleText([]);
                        setIneligibleVoice([]);
                    });
            } catch (e) {
                if (cancelled) return;
                // Keep skeleton visible and retry with exponential backoff
                const next = Math.min(retryMs * 2, 10000);
                timer = setTimeout(() => {
                    if (!cancelled) load();
                }, retryMs);
                setRetryMs(next);
            }
        };

        load();

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
        }
    }, [channelID, status]);

    useEffect(() => {
        try {
            setChannelID(channelID);
        } catch {
        }
    }, [channelID, setChannelID]);

    useEffect(() => {
        apiFetch('/v1/permissions/messages/manage')
            .then(d => setCanManageMessages(!!d.canManage))
            .catch(() => setCanManageMessages(false));
    }, []);

    useEffect(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        if (loadingOlder) return;

        if (initialAutoScrollPending.current) {
            setTimeout(() => {
                const anchor = messagesListRef.current;
                if (anchor) {
                    anchor.scrollIntoView({behavior: 'auto', block: 'end'});
                } else if (messagesContainerRef.current) {
                    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                }
                initialAutoScrollPending.current = false;
                // after initial scroll, we are at bottom
                isAtBottomRef.current = true;
            }, 0);
            return;
        }

        if (isAtBottomRef.current) {
            setTimeout(() => {
                messagesListRef.current?.scrollIntoView({behavior: 'smooth', block: 'end'});
            }, 0);
        }
    }, [chat, loadingOlder]);

    const loadOlder = async () => {
        if (initialAutoScrollPending.current) return;
        if (loadingOlder || !hasMore || loadingMessages) return;
        const container = messagesContainerRef.current;
        const oldest = chat[0]?.timestamp;
        if (!container || !oldest) return;
        setLoadingOlder(true);
        const prevHeight = container.scrollHeight;
        try {
            const data: MsgWithID[] = await apiFetch(`/v1/messages/${channelID}?limit=${INITIAL_LIMIT}&before=${oldest}`);
            if (Array.isArray(data) && data.length > 0) {
                setChat(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const deduped = data.filter(m => !existingIds.has(m.id));
                    return [...deduped, ...prev];
                });
                setTimeout(() => {
                    if (!messagesContainerRef.current) return;
                    const newHeight = messagesContainerRef.current.scrollHeight;
                    messagesContainerRef.current.scrollTop = newHeight - prevHeight + messagesContainerRef.current.scrollTop;
                }, 0);
                if (data.length < INITIAL_LIMIT) setHasMore(false);
            } else {
                setHasMore(false);
            }
        } catch (e) {
            // ignore
        } finally {
            setLoadingOlder(false);
        }
    };

    useEffect(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                ticking = false;
                if (initialAutoScrollPending.current) return;
                // update bottom state
                const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
                isAtBottomRef.current = distanceFromBottom <= 100;
                if (el.scrollTop < 250) {
                    loadOlder();
                }
            });
        };
        // initialize at-bottom state when attaching
        const initDistance = el.scrollHeight - (el.scrollTop + el.clientHeight);
        isAtBottomRef.current = initDistance <= 100;
        el.addEventListener('scroll', onScroll);
        return () => {
            el.removeEventListener('scroll', onScroll);
        };
    }, [messagesContainerRef.current, hasMore, loadingOlder, loadingMessages, chat, channelID]);

    useEffect(() => {
        function generateSkeletons() {
            const approxItemHeight = 72;
            const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
            const count = Math.max(6, Math.ceil(viewportH / approxItemHeight));
            const items = Array.from({length: count}).map(() => ({
                nameW: 20 + Math.random() * 30,
                line1W: 50 + Math.random() * 40,
                line2W: 30 + Math.random() * 60,
            }));
            setSkeletonItems(items);
        }

        if (loadingMessages) {
            generateSkeletons();
            window.addEventListener('resize', generateSkeletons);
            return () => window.removeEventListener('resize', generateSkeletons);
        }
    }, [loadingMessages]);

    const nonChar = [
        "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
        "Home", "End", "PageUp", "PageDown",

        "Escape", "Enter", "Tab",
        "ContextMenu", "PrintScreen", "Pause", "ScrollLock",

        "Alt", "AltGraph", "CapsLock", "Control", "Fn", "FnLock",
        "Meta", "Shift", "NumLock", "Symbol", "SymbolLock", "Hyper",

        "F1", "F2", "F3", "F4", "F5", "F6",
        "F7", "F8", "F9", "F10", "F11", "F12",
        "Soft1", "Soft2", "Soft3", "Soft4",

        "Clear",
        "Copy",

        "MediaPlay", "MediaPause", "MediaStop",
        "MediaTrackNext", "MediaTrackPrevious", "MediaSelect",

        "VolumeMute", "VolumeDown", "VolumeUp",
        "AudioVolumeMute", "AudioVolumeDown", "AudioVolumeUp",

        "LaunchMail", "LaunchMediaPlayer",

        "SpeechToggle", "SpeechDictation",

        "NumpadEnter",
        "NumpadAdd", "NumpadSubtract", "NumpadMultiply", "NumpadDivide",
        "NumpadDecimal",
        "NumpadEqual",
        "NumpadParenLeft", "NumpadParenRight",
        "NumpadMemoryAdd", "NumpadMemoryClear", "NumpadMemoryRecall",
        "NumpadMemoryStore", "NumpadMemorySubtract",

        "Help", "Insert", "Clear",

        "Unidentified"
    ];

    const FormSchema = z.object({
        volunteer: z.object({
            id: z.string({
                required_error: "Merci de sélectionner un Bénévole Écoutant",
            }),
            name: z.string(),
        }),
    });

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });

    function assign(data: z.infer<typeof FormSchema>) {
        apiFetch(`/v1/tickets/assign`, {
            method: "POST",
            body: JSON.stringify({
                ticketID: ticket?.id,
                assignmentID: data.volunteer.id
            }),
        }).then(res => {
            if (res.success) {
                toast.success(`L'écoute à été attribuée à ${data.volunteer.name}`)
                setStatus(2)
                socket?.emit('update')
            } else {
                return toast("Erreur lors de l'attribution", {
                    description: (
                        <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
                          <code className="text-white">{JSON.stringify(res.error, null, 2)}</code>
                        </pre>
                    ),
                })
            }
        })
    }

    const transmissionSchema = z.object({
        problematic: z.string().min(1, "Requis"),
        observations: z.string().min(1, "Requis"),
        info: z.string().optional(),
        categories: z.array(z.string()).min(1, "Choisissez au moins une catégorie"),
    });

    const transmissionForm = useForm<z.infer<typeof transmissionSchema>>({
        resolver: zodResolver(transmissionSchema),
        defaultValues: {
            categories: [],
        }
    });

    function transmission(data: z.infer<typeof transmissionSchema>) {
        apiFetch('/v1/tickets/transmission', {
            method: "POST",
            body: JSON.stringify({
                channelID,
                problematic: data.problematic,
                observations: data.observations,
                info: data.info,
                categories: data.categories,
            })
        }).then(res => {
            if (res.success) {
                toast("Transmission envoyée")
                setTimeout(() => {
                    router.push("/app/chat")
                    socket?.emit('update')
                }, 2000)
            } else {
                return toast("Erreur lors de la transmission", {
                    description: (
                        <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
                  <code className="text-white">{JSON.stringify(data, null, 2)}</code>
                </pre>
                    ),
                })
            }
        })
    }

    const roleOrderAndLabels: Record<string, string> = {
        admin: "Administrateur",
        bot: "Robot",
        manager: "Référent Bénévole Écoutant",
        volunteer: "Bénévole Écoutant",
        training: "Bénévole en formation"
    };
    const displayRoleOrder = ['admin', 'bot', 'manager', 'volunteer', 'training'] as const;

    return (
        <div className="flex flex-row items-center justify-center w-full">
            <div className="flex flex-col relative h-svh p-3 gap-4 w-full" tabIndex={0} ref={rootDivRef}>
                {/*<video className='w-0 h-0' playsInline ref={callingVideoRef} autoPlay/>*/}
                <div className="flex flex-col flex-grow overflow-y-auto" ref={messagesContainerRef}>
                    <div className="h-28 shrink-0"/>
                    {loadingMessages ? (
                        <div className="flex flex-col gap-4 px-2 py-2">
                            {skeletonItems.map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <Skeleton className="h-9 w-9 rounded-lg shrink-0"/>
                                    <div className="flex-1 space-y-2 py-1">
                                        <Skeleton className="h-4 max-w-[220px]" style={{width: `${item.nameW}%`}}/>
                                        <Skeleton className="h-4" style={{width: `${item.line1W}%`}}/>
                                        <Skeleton className="h-4" style={{width: `${item.line2W}%`}}/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <React.Fragment key="messages-list">
                            {loadingOlder && (
                                <div className="flex justify-center py-2">
                                    <Skeleton className="h-4 w-1/3"/>
                                </div>
                            )}
                            {chat.map(({author, content, timestamp, reactions, id, replyID, edited}, key) => {
                                const prevMessage = key > 0 ? chat[key - 1] : null
                                const nextMessage = key < chat.length - 1 ? chat[key + 1] : null
                                const currentDate = new Date(timestamp).getTime()
                                const prevDate = prevMessage ? new Date(prevMessage.timestamp).getTime() : null
                                const nextDate = nextMessage ? new Date(nextMessage.timestamp).getTime() : null

                                const isSameAuthorAsPrev = prevMessage && prevMessage.author.id === author.id
                                const isWithin10MinOfPrev = prevDate !== null && Math.abs(currentDate - prevDate) / 60000 < 10
                                const showAuthorInfo = !isSameAuthorAsPrev || !isWithin10MinOfPrev

                                const isSameAuthorAsNext = nextMessage && nextMessage.author.id === author.id
                                const isWithin10MinOfNext = nextDate !== null && Math.abs(nextDate - currentDate) / 60000 < 10
                                const isLastInBlock = !isSameAuthorAsNext || !isWithin10MinOfNext

                                const ref = replyID ? chat.find(m => m.id === replyID) : undefined;
                                return (
                                    <Message
                                        prevDate={prevDate as number}
                                        currentDate={currentDate}
                                        timestamp={timestamp}
                                        reactions={reactions as Reaction[]}
                                        key={id}
                                        isLastInBlock={isLastInBlock}
                                        showAuthorInfo={showAuthorInfo}
                                        isAuthor={author.id === session?.user.id}
                                        profilePicture={author.image}
                                        authorRole={author.role}
                                        authorName={author.name}
                                        content={content}
                                        userID={session?.user.id as string}
                                        id={id as number}
                                        channelId={channelID}
                                        canManageMessages={canManageMessages}
                                        edited={edited}
                                        onReply={({id, authorName, content, timestamp}) => {
                                            setReplyTo({id, authorName, content, timestamp});
                                            setTimeout(() => textRef.current?.focus(), 0);
                                        }}
                                        replyTargetId={replyTo?.id}
                                        replyOf={ref ? {
                                            id: ref.id,
                                            authorName: ref.author.name,
                                            content: ref.content,
                                            image: ref.author.image
                                        } : undefined}
                                        readOnly={status === 3 || status === 4}
                                    />
                                );
                            })}
                        </React.Fragment>
                    )}
                    <div className="pb-4"/>
                    <div ref={messagesListRef} className="h-px"/>
                </div>


                {
                    status === 0 ? null :
                        <div className="absolute top-6 right-6 flex flex-row gap-2 z-20">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        className={channelID == "1" || status == 3 || status == 4 ? "hidden" : "flex"}
                                        variant="outline" disabled={status == 3 || status == 4}>
                                        <UserRoundPlus/> Attribuer
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Merci de choisir le bénévole à
                                            attribuer</AlertDialogTitle>
                                    </AlertDialogHeader>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(assign)} className="space-y-6">
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
                                                                                (available) => available.value.name === field.value.name
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
                                                                        <CommandEmpty>Aucun bénévole
                                                                            trouvé</CommandEmpty>
                                                                        <CommandGroup>
                                                                            {available.map((available) => (
                                                                                <CommandItem
                                                                                    value={available.label}
                                                                                    key={available.value.id}
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
                                                <AlertDialogAction asChild>
                                                    <Button type="submit">Valider</Button>
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </form>
                                    </Form>
                                </AlertDialogContent>
                            </AlertDialog>

                            <Button
                                className={channelID == "1" || status !== 2 ? "hidden" : "flex"}
                                variant='outline'
                                color={callColor}
                                onClick={handleCall}
                                disabled={status !== 2}
                            >
                                <PhoneCall color={callColor}/> Démarrer un vocal
                                <audio ref={myAudioRef} autoPlay
                                       muted/>  {/* my own voice (muted so I don't hear myself) */}
                                <audio ref={remoteAudioRef} autoPlay/>
                                {/* the other user's audio */}
                            </Button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        className={channelID == "1" || status == 3 || status == 4 ? "hidden" : "flex"}
                                        variant="destructive" disabled={status == 3 || status == 4}>
                                        <MessageCircleOff/> Fermer l'écoute
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Attention, êtes vous certain ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            La fermeture d'une écoute est irréversible. Pour simplement retourner au
                                            chat de
                                            permanence merci d'utiliser l'onglet latéral.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction asChild>
                                            <Button variant="destructive" onClick={() => {
                                                apiFetch('/v1/tickets/close', {
                                                    method: 'POST',
                                                    body: JSON.stringify({
                                                        channelID: channelID
                                                    })
                                                }).then(res => {
                                                    if (res.success) {
                                                        setStatus(3)
                                                        socket?.emit('update')
                                                    }
                                                })
                                            }}>
                                                Fermer l'écoute
                                            </Button>
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className={channelID == "1" || status !== 3 ? "hidden" : "flex"}
                                            variant="outline" disabled={status !== 3}>
                                        <NotebookPen/> Transmission
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Merci de remplir la fiche de
                                            transmission</AlertDialogTitle>
                                    </AlertDialogHeader>
                                    <Form {...transmissionForm}>
                                        <form onSubmit={transmissionForm.handleSubmit(transmission)}
                                              className="space-y-6">
                                            <FormField
                                                control={transmissionForm.control}
                                                name="problematic"
                                                render={({field}) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel>Problématique de l'écoute* :</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Problématique..."
                                                                className="resize-none"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={transmissionForm.control}
                                                name="observations"
                                                render={({field}) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel>Observations générales* :</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Observations..."
                                                                className="resize-none"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={transmissionForm.control}
                                                name="info"
                                                render={({field}) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel>Informations supplémentaires (optionnel)
                                                            :</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Informations..."
                                                                className="resize-none"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={transmissionForm.control}
                                                name="categories"
                                                render={({field}) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel>Catégories de l'écoute* :</FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        className={cn(
                                                                            "w-full justify-between h-auto min-h-10",
                                                                            !field.value?.length && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {field.value?.length > 0 ? (
                                                                                field.value.map((val: string) => (
                                                                                    <Badge key={val} variant="secondary"
                                                                                           className="mr-1">
                                                                                        {val}
                                                                                    </Badge>
                                                                                ))
                                                                            ) : (
                                                                                "Sélectionner les catégories..."
                                                                            )}
                                                                        </div>
                                                                        <ChevronsUpDown
                                                                            className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent
                                                                className="w-[--radix-popover-trigger-width] p-0">
                                                                <Command>
                                                                    <CommandInput
                                                                        placeholder="Rechercher une catégorie..."/>
                                                                    <CommandList>
                                                                        <CommandEmpty>Aucune catégorie
                                                                            trouvée.</CommandEmpty>
                                                                        <CommandGroup>
                                                                            {availableCategories.map((item) => (
                                                                                <CommandItem
                                                                                    key={item}
                                                                                    value={item}
                                                                                    onSelect={() => {
                                                                                        const newValue = field.value?.includes(item)
                                                                                            ? field.value.filter((v: string) => v !== item)
                                                                                            : [...(field.value || []), item];
                                                                                        field.onChange(newValue);
                                                                                    }}
                                                                                >
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "mr-2 h-4 w-4",
                                                                                            field.value?.includes(item) ? "opacity-100" : "opacity-0"
                                                                                        )}
                                                                                    />
                                                                                    {item}
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormDescription>
                                                            Sélectionnez une ou plusieurs catégories correspondant à
                                                            l'échange.
                                                        </FormDescription>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction asChild>
                                                    <Button type="submit">Envoyer</Button>
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </form>
                                    </Form>
                                </AlertDialogContent>
                            </AlertDialog>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <Info/>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="w-[1000px]">
                                    <DialogHeader>
                                        <VisuallyHidden>
                                            <DialogTitle>Informations de l'écoute</DialogTitle>
                                        </VisuallyHidden>
                                        {/*<DialogDescription>*/}
                                        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight flex flex-row gap-3">
                                            <CircleAlert/> Vigilances
                                        </h4>
                                        <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                                            {
                                                ticketInfo?.vigis.length && ticketInfo.vigis.length > 0 ?
                                                    ticketInfo?.vigis.map((item, index) => (
                                                        <li key={index}>{item.date.toLocaleDateString()} - {item.motive}</li>
                                                    )) : <li>Aucune vigilance en cours</li>
                                            }
                                        </ul>

                                        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight flex flex-row gap-3">
                                            <UserRoundX/> Bénévoles Inéligibles
                                        </h4>
                                        <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                                            {ineligibleText.length > 0 ? (
                                                ineligibleText.map((name, index) => (
                                                    <li key={index}>{name}</li>
                                                ))
                                            ) : (
                                                <li>Aucun bénévole inéligible</li>
                                            )}
                                        </ul>

                                        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight flex flex-row gap-3">
                                            <MicOff/> Bénévoles Inéligibles Vocal
                                        </h4>
                                        <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                                            {ineligibleVoice.length > 0 ? (
                                                ineligibleVoice.map((name, index) => (
                                                    <li key={index}>{name}</li>
                                                ))
                                            ) : (
                                                <li>Aucun bénévole inéligible</li>
                                            )}
                                        </ul>

                                        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight flex flex-row gap-3">
                                            <IdCardLanyard/> Identifiant
                                        </h4>
                                        <p className="leading-7 [&:not(:first-child)]:mt-6">
                                            Numéro d'anonymat : 277dd0... <Button variant="secondary">
                                            <Copy/> Copier</Button>
                                        </p>
                                        <p className="leading-7 [&:not(:first-child)]:mt-6">
                                            Identifiant Discord : <Button variant="secondary">
                                            <ScanFace/> Révéler</Button>
                                        </p>

                                        {/*</DialogDescription>*/}
                                    </DialogHeader>
                                </DialogContent>
                            </Dialog>
                        </div>
                }

                <div className="sticky bottom-0">
                    {/* Feedback Form for closed tickets */}

                    {replyTo && (
                        <div
                            className="flex items-start justify-between gap-2 mb-2 p-2 rounded-md border border-blue-300 bg-blue-50 text-blue-900">
                            <div className="flex flex-col text-sm">
                                <span className="font-medium">Répondre à {replyTo.authorName}</span>
                                <span className="truncate max-w-[70vw] text-blue-800">{replyTo.content}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setReplyTo(null)}
                                    aria-label="Annuler la réponse">
                                <X/>
                            </Button>
                        </div>
                    )}

                    {(typingUsers.length > 0) && (
                        <div
                            className="mb-2 px-3 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
                            <div className="flex -space-x-2">
                                {typingUsers.slice(0, 3).map(u => (
                                    <Avatar key={u.id}
                                            className="h-5 w-5 rounded-full border border-white dark:border-gray-800">
                                        <AvatarImage src={u.image || ""} alt={u.name}/>
                                        <AvatarFallback
                                            className="rounded-full bg-primary text-[6px] text-primary-foreground font-bold">
                                            {u.name?.slice(0, 2).toUpperCase() || "US"}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                            </div>
                            <span className="whitespace-nowrap">
                                    {(() => {
                                        const names = typingUsers.map(u => u.name).filter(Boolean);
                                        if (names.length === 1) return `${names[0]} est entrain d\'écrire...`;
                                        if (names.length === 2) return `${names[0]} et ${names[1]} sont entrain d\'écrire...`;
                                        return `${names[0]}, ${names[1]} et ${names.length - 2} autres sont entrain d\'écrire...`;
                                    })()}
                                </span>
                            <div className="flex items-center gap-1 ml-1">
                                <FontAwesomeIcon icon={faCircle}
                                                 className="text-gray-400 animate-opacityPulse1 w-2 h-2"/>
                                <FontAwesomeIcon icon={faCircle}
                                                 className="text-gray-400 animate-opacityPulse2 w-2 h-2"/>
                                <FontAwesomeIcon icon={faCircle}
                                                 className="text-gray-400 animate-opacityPulse3 w-2 h-2"/>
                            </div>
                        </div>
                    )}

                    <form ref={formRef} onSubmit={(e) => sendForm(e)}
                          className='flex flex-row w-full gap-2 items-center'>
                        <ContextMenu>
                            <ContextMenuTrigger asChild>
                                <div
                                    className="relative w-full"
                                    ref={inputWrapperRef}
                                    onContextMenuCapture={(e) => {
                                        const target = e.target as HTMLElement | null;
                                        if (target && target.classList && target.classList.contains('lt-err')) {
                                            // allow Radix to open; data will be set by overlay handler
                                        } else {
                                            // prevent opening when right-clicking outside errors
                                            e.preventDefault();
                                        }
                                    }}
                                >
                                    {/* Overlay showing highlights */}
                                    <div
                                        ref={overlayRef}
                                        className="absolute inset-0 pointer-events-none whitespace-pre-wrap rounded-lg lt-overlay"
                                        onContextMenu={(e) => {
                                            const target = e.target as HTMLElement | null;
                                            if (target && target.classList && target.classList.contains('lt-err')) {
                                                const off = Number(target.getAttribute('data-offset') || '0');
                                                const len = Number(target.getAttribute('data-length') || '0');
                                                const match = ltMatches.find(m => m.offset === off && m.length === len);
                                                setCtxData({
                                                    offset: off,
                                                    length: len,
                                                    suggestions: match?.replacements?.slice(0, 6) || []
                                                });
                                            }
                                        }}
                                        dangerouslySetInnerHTML={{__html: highlightHtml || ''}}
                                    />
                                    {/* Actual textarea capturing input */}
                                    <Textarea
                                        placeholder={`Envoyer un message dans ${channelName}`}
                                        onChange={(e) => {
                                            setCurrentMsg(e.target.value)
                                            sendTyping()
                                        }}
                                        disabled={status == 3 || status == 4}
                                        ref={textRef}
                                        onScroll={(e) => {
                                            if (overlayRef.current) {
                                                overlayRef.current.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
                                                overlayRef.current.scrollLeft = (e.target as HTMLTextAreaElement).scrollLeft;
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                formRef.current?.requestSubmit();
                                            }
                                        }}
                                        spellCheck={false}
                                        lang="fr"
                                        data-ms-editor="false"
                                        value={currentMsg}
                                        className={cn(
                                            "w-full flex flex-row outline-main outline-1 p-2 rounded-lg resize-none"
                                        )}
                                    />
                                    {/* Inline styles for LanguageTool highlighting */}
                                    <style jsx global>{`
                                .lt-overlay {
                                  color: transparent; /* hide overlay text while keeping underline color */
                                  overflow: hidden; /* will follow textarea scroll via JS */
                                }
                                .lt-err {
                                  text-decoration-line: underline;
                                  text-decoration-style: wavy;
                                  text-decoration-color: #ef4444; /* red-500 */
                                  text-underline-offset: 2px;
                                  pointer-events: auto; /* allow right-click on errors */
                                  cursor: context-menu;
                                }
                              `}</style>
                                </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="min-w-[180px] max-w-[260px]">
                                {ctxData.suggestions && ctxData.suggestions.length > 0 ? (
                                    ctxData.suggestions.map((s, i) => (
                                        <ContextMenuItem
                                            key={i}
                                            onSelect={() => {
                                                const before = currentMsg.slice(0, ctxData.offset);
                                                const after = currentMsg.slice(ctxData.offset + ctxData.length);
                                                const newText = before + s + after;
                                                setCurrentMsg(newText);
                                                setTimeout(() => {
                                                    const pos = before.length + s.length;
                                                    textRef.current?.focus();
                                                    textRef.current?.setSelectionRange(pos, pos);
                                                }, 0);
                                            }}
                                        >
                                            {s}
                                        </ContextMenuItem>
                                    ))
                                ) : (
                                    <ContextMenuItem disabled>Aucune suggestion</ContextMenuItem>
                                )}
                            </ContextMenuContent>
                        </ContextMenu>

                        <Popover onOpenChange={setEmojiOpen} open={emojiOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={status == 3 || status == 4}>
                                    <Laugh/>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-fit p-0">
                                <EmojiPicker
                                    className="h-[342px]"
                                    onEmojiSelect={({emoji}) => {
                                        if (currentMsg.length > 0) setCurrentMsg(currentMsg + ' ' + emoji);
                                        else setCurrentMsg(emoji);
                                        setEmojiOpen(false);
                                        textRef.current?.focus();
                                        console.log(emoji);
                                    }}
                                    locale="fr"
                                >
                                    <EmojiPickerSearch/>
                                    <EmojiPickerContent/>
                                    <EmojiPickerFooter/>
                                </EmojiPicker>
                            </PopoverContent>
                        </Popover>

                        <Popover onOpenChange={setGifOpen} open={gifOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={status == 3 || status == 4}>
                                    <TvMinimalPlay/>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-fit p-0">
                                <GifPicker tenorApiKey={process.env.NEXT_PUBLIC_TENOR_KEY as string}
                                           onGifClick={(gif) => {
                                               sendMessage(gif.url)
                                               setGifOpen(false);
                                           }}/>
                            </PopoverContent>
                        </Popover>

                        <Button variant="ghost" size="icon" disabled={status == 3 || status == 4}>
                            <Send/>
                        </Button>
                        {/*<button className='cursor-pointer'><Send width={42}/></button>*/}
                    </form>
                </div>
            </div>

            <div className="hidden lg:flex flex-col justify-start h-svh w-80 p-6 gap-3 border-l-main border-l">
                <div>
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight truncate">{channelName}</h3>
                        <Dialog open={eventDialogOpen} onOpenChange={(open) => {
                            setEventDialogOpen(open);
                            if (open) fetchEventInfo();
                        }}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                                    <Info className="h-4 w-4"/>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Planning de l'événement</DialogTitle>
                                </DialogHeader>
                                {loadingEvent ? (
                                    <div className="flex flex-col gap-2">
                                        <Skeleton className="h-20 w-full"/>
                                        <Skeleton className="h-20 w-full"/>
                                    </div>
                                ) : eventInfo ? (
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-lg font-bold">{eventInfo.title}</h4>
                                            <p className="text-sm text-muted-foreground">{eventInfo.description}</p>
                                        </div>

                                        <div className="space-y-4">
                                            {eventInfo.roleSlots.map((slot) => (
                                                <div key={slot.id} className="border rounded-lg p-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h5 className="font-semibold capitalize">
                                                            {roleOrderAndLabels[slot.role] || slot.role}
                                                            {slot.part && ` — ${slot.part === 'first' ? '1ère partie' : '2ème partie'}`}
                                                        </h5>
                                                        <Badge variant="outline">
                                                            {slot.registrationsCount} / {slot.goalCount}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {slot.registrations.map((reg) => {
                                                            const user = reg.user;
                                                            if (!user) return null;
                                                            const isOnline = onlineUsers.some(u => u.id === user.id);
                                                            const isAvailableForListening = !user.hasActiveTicket;

                                                            return (
                                                                <div key={reg.id}
                                                                     className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                                                    <Avatar className="h-8 w-8">
                                                                        <AvatarImage src={user.image || ""}/>
                                                                        <AvatarFallback>
                                                                            {user.name?.slice(0, 2).toUpperCase()}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span
                                                                            className="text-sm font-medium truncate">{user.name}</span>
                                                                        <div className="flex gap-1.5 items-center">
                                                                            <span className={cn(
                                                                                "w-2 h-2 rounded-full",
                                                                                isOnline ? "bg-green-500" : "bg-gray-400"
                                                                            )}/>
                                                                            <span
                                                                                className="text-[10px] text-muted-foreground uppercase">
                                                                                {isOnline ? "En ligne" : "Hors ligne"}
                                                                            </span>
                                                                            <span
                                                                                className="text-muted-foreground">·</span>
                                                                            <Badge
                                                                                variant={isAvailableForListening ? "default" : "secondary"}
                                                                                className={cn("px-1 py-0 text-[9px] h-3.5 leading-none", isAvailableForListening && "bg-green-600 hover:bg-green-700 text-white border-transparent")}>
                                                                                {isAvailableForListening ? "Disponible" : "En écoute"}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        {slot.registrations.length === 0 && (
                                                            <p className="text-xs text-muted-foreground italic col-span-full">
                                                                Aucun inscrit pour ce créneau
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center py-8 text-muted-foreground">
                                        Aucun événement de planning n'est associé à ce salon.
                                    </p>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>
                    <small className="text-sm leading-none font-medium">
                        {onlineUsers.length} utilisateur{onlineUsers.length >= 2 ? "s" : ""} connecté{onlineUsers.length >= 2 ? "s" : ""}
                    </small>
                </div>
                <div className="flex flex-col overflow-y-auto">
                    {Object.entries(
                        (() => {
                            // Merge allMembers and onlineUsers
                            const memberMap = new Map<string, UserFromList & { isOnline: boolean }>();
                            allMembers.forEach(m => memberMap.set(m.id, {...m, isOnline: false}));
                            onlineUsers.forEach(u => {
                                memberMap.set(u.id, {...(memberMap.get(u.id) || u), isOnline: true});
                            });

                            const merged = Array.from(memberMap.values());

                            const online = merged.filter(m => m.isOnline);
                            const offline = merged.filter(m => !m.isOnline);

                            const grouped = online.reduce((acc, user) => {
                                const roleKey = Array.isArray(user.role) ? (user.role[0] as string) : (user.role as string);
                                (acc[roleKey] ||= []).push(user);
                                return acc;
                            }, {} as Record<string, (UserFromList & { isOnline?: boolean })[]>);

                            if (offline.length > 0) {
                                grouped['offline'] = offline;
                            }

                            return grouped;
                        })()
                    ).sort(
                        ([roleA], [roleB]) => {
                            if (roleA === 'offline') return 1;
                            if (roleB === 'offline') return -1;
                            return (displayRoleOrder as readonly string[]).indexOf(roleA) -
                                (displayRoleOrder as readonly string[]).indexOf(roleB);
                        }
                    ).map(([role, users]) => {
                        const sortedUsers = [...users].sort((a, b) => a.username.localeCompare(b.username));

                        return (
                            <div key={role} className="mb-4">
                                <h4 className="text-md font-semibold text-gray-700 mb-2 capitalize">
                                    {role === 'offline' ? 'Hors ligne' : (roleOrderAndLabels[role] || role)} — {users.length}
                                </h4>
                                <div className="flex flex-col gap-2">
                                    {sortedUsers.map(user => (
                                        <div
                                            key={user.id}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-opacity",
                                                !user.isOnline && "opacity-50"
                                            )}
                                        >
                                            <div className="relative">
                                                <Avatar className="h-8 w-8 rounded-lg border">
                                                    <AvatarImage src={user.image || ""} alt={user.username}/>
                                                    <AvatarFallback
                                                        className="rounded-lg bg-primary text-primary-foreground font-bold">
                                                        {user.username?.slice(0, 2).toUpperCase() || "US"}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                                                {user.username}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}