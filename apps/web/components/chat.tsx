"use client";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCircle} from "@fortawesome/free-solid-svg-icons";
import GifPicker from "gif-picker-react";
import {EmojiPicker, EmojiPickerContent, EmojiPickerFooter, EmojiPickerSearch,} from "@/components/ui/emoji-picker";
import {
    Check,
    ChevronsUpDown,
    Info,
    Laugh,
    MessageCircleOff,
    NotebookPen,
    Send,
    ShieldAlert,
    TvMinimalPlay,
    UserRoundPlus,
    X
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import React, {FormEvent, useEffect, useRef, useState} from "react";
import {EventData, formVolunteer, Msg, MsgWithID} from "@/lib/interface";
import {TicketInfoDialog} from "@/components/ticket-info-dialog";
import {PermanencePresence} from "@/components/permanence-presence";
import {ObservationBar, SpectatePanel, useSpectate} from "@/components/spectate-panel";
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
    Label,
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
import type {Reaction, Ticket} from "../../../generated/prisma"
import {useRouter} from "next/navigation";
import {Message} from "@/components/message";
import {useSocket} from "@/context/Socket";
import {PermanenceVoiceControls, TicketVoiceControls} from "@/components/voice/chat-voice-controls";
import {apiFetch} from "@/lib/api";
import {markChannelAsRead} from "@/app/actions/chat";

/** "Nouveaux messages" divider: cleared once it has been fully on screen. One observer, cleaned up. */
function UnreadSeparator({onSeen}: { onSeen: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    const seen = useRef(onSeen);
    useEffect(() => {
        seen.current = onSeen;
    }, [onSeen]);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                seen.current();
                observer.disconnect();
            }
        }, {threshold: 1.0});
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return (
        <div ref={ref} role="separator" aria-label="Nouveaux messages" className="flex items-center my-4 unread-separator">
            <div className="flex-grow h-px bg-red-500/50" aria-hidden/>
            <span className="mx-4 text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider bg-background px-2" aria-hidden>
                Nouveaux messages
            </span>
            <div className="flex-grow h-px bg-red-500/50" aria-hidden/>
        </div>
    );
}

export function Chat(props: { channelID: string, statusID: number }) {
    const {channelID, statusID} = props;
    const [status, setStatus] = useState(statusID);
    // Dialogs closed by hand once their request succeeded (a closing button must not be the
    // submit button: it removes the form before the browser submits it)
    const [assignOpen, setAssignOpen] = useState(false);
    const [transmissionOpen, setTransmissionOpen] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [closeReason, setCloseReason] = useState("");
    // Managers (tickets.attribute) may close an écoute nobody was assigned to without a transmission
    const [canAttribute, setCanAttribute] = useState(false);
    // Volunteers in training observing this écoute: read-only, no écoute toolbar
    const {state: spectate, reload: reloadSpectate} = useSpectate();
    const observation = status !== 0 && spectate?.me.request?.status === "approved"
    && spectate.me.request.ticket?.channelId === channelID ? spectate.me.request : null;
    const {data: session} = useSession();
    const {socket, setChannelID} = useSocket();
    const router = useRouter();
    const [emojiOpen, setEmojiOpen] = useState(false);
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
    const {toggleSidebar} = useSidebar();
    const [canManageMessages, setCanManageMessages] = useState(false);
    const [eventInfo, setEventInfo] = useState<EventData | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(false);
    const [eventDialogOpen, setEventDialogOpen] = useState(false);
    const [lastReadTimestamp, setLastReadTimestamp] = useState<number | null>(null);
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
    const lastReadFetched = useRef<string | null>(null);

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

    const initialAutoScrollPending = useRef(false);
    const isAtBottomRef = useRef(true);

    const messageSchema = z
        .string()
        .max(2000, "Votre message est trop long")
        .refine((val) => val.trim().length >= 1, {
            message: "Contenu du message non supporté",
        });


    /** True once saved; on failure the user is told and nothing is lost (see sendForm). */
    const sendMessage = async (content: string): Promise<boolean> => {
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
            // The server takes the author from the session and returns the stored (sanitised) content
            const savedMessage = await saveMessage({channelId: channelID, content, replyID: msg.replyID ?? null});
            const msgWithID: MsgWithID = {
                ...msg,
                content: savedMessage.content,
                id: savedMessage.id,
                replyID: msg.replyID ?? null,
            };

            socket?.emit("sendMessage", msgWithID);
            isAtBottomRef.current = true;
            setChat((pre) => {
                if (savedMessage.id && pre.some(m => m.id === savedMessage.id)) return pre;
                return [...pre, msgWithID];
            });
            return true;
        } catch (error) {
            console.error("Error saving message:", error);
            toast.error((error as Error)?.message || "Le message n'a pas pu être envoyé. Réessayez.");
            return false;
        }
    };

    const sendForm = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            messageSchema.parse(currentMsg);
        } catch (error) {
            if (error instanceof ZodError) {
                return toast.error(error.issues[0].message);
            }
        }
        if (currentMsg !== "") {
            const draft = currentMsg;
            const reply = replyTo;
            setCurrentMsg("");
            setReplyTo(null);
            // Not saved: the text and the reply come back, so nothing typed is lost
            if (!await sendMessage(draft)) {
                setCurrentMsg(current => current || draft);
                setReplyTo(current => current ?? reply);
            }
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

    type UserFromList = {
        id: string;
        username: string;
        image: string | null;
        role: string | string[];
    };

    const [onlineUsers, setOnlineUsers] = useState<UserFromList[]>([]);
    const [allMembers, setAllMembers] = useState<UserFromList[]>([]);
    const onlineIds = new Set(onlineUsers.map(u => u.id));
    const onlineMemberCount = allMembers.filter(m => onlineIds.has(m.id)).length;

    // Roles as configured on the roles page (name, order, icon); refreshed when they change.
    const [configuredRoles, setConfiguredRoles] = useState<{ name: string; weight: number; icon?: string | null }[]>([]);
    useEffect(() => {
        const load = () => apiFetch('/v1/admin/roles')
            .then((res: any) => setConfiguredRoles(Array.isArray(res?.roles) ? res.roles : []))
            .catch(() => undefined);
        load();
        if (!socket) return;
        socket.on('permissionsUpdate', load);
        return () => {
            socket.off('permissionsUpdate', load);
        };
    }, [socket]);

    // Members keep their whole role list (comma-joined); grouping happens at display time.
    const getHighestRole = (role: string | string[] | undefined | null): string =>
        (Array.isArray(role) ? role.join(',') : role || '');


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

        // Online = connected to Solar, whatever the page they are on
        const handleOnline = (payload: { user: UserFromList }) => {
            if (!payload?.user) return;
            const normalizedUser = {...payload.user, role: getHighestRole(payload.user.role as any)};
            setOnlineUsers(prev => prev.some(u => u.id === normalizedUser.id) ? prev : [...prev, normalizedUser]);
        };
        const handleOffline = (payload: { user: UserFromList }) => {
            if (payload?.user) setOnlineUsers(prev => prev.filter(u => u.id !== payload.user.id));
        };

        socket.on("userOnline", handleOnline);
        socket.on("userOffline", handleOffline);

        const onMessage = (data: Msg) => {
            if (data.channel.id === channelID) {
                const isMe = data.author.id === session?.user.id;
                setChat((pre) => {
                    const exists = (data as MsgWithID).id && pre.some(m => m.id === (data as MsgWithID).id);
                    if (exists) return pre;
                    return [...pre, data as MsgWithID];
                })
                if (timer) clearTimeout(timer)
                
                // Mark as read if at bottom or if it's my own message
                if (isAtBottomRef.current || isMe) {
                    markChannelAsRead(channelID);
                    setLastReadTimestamp(Date.now());
                } else if (document.hasFocus()) {
                    markChannelAsRead(channelID);
                }
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

        // Discord écoutes: the bot could not deliver a message to the user (#298)
        const onMessageUndelivered = (data: { id: number }) => {
            setChat(prev => prev.map(m => m.id === data.id ? {...m, undelivered: true} : m));
        };

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
        socket.on('messageUndelivered', onMessageUndelivered);

        return () => {
            socket.off('userList', handleUserList);
            socket.off('userOnline', handleOnline);
            socket.off('userOffline', handleOffline);
            socket.off('connect', handleConnect);
            socket.off('reconnect', handleConnect as any);
            socket.off('reconnect_attempt', requestSnapshot as any);
            if (pollId) clearInterval(pollId);
            socket.off('message', onMessage);
            socket.off('reactionAdd', onReactionAdd);
            socket.off('reactionRemove', onReactionRemove);
            socket.off('typingIndicator', onTyping);
            socket.off('messageDelete', onMessageDelete);
            socket.off('messageUndelivered', onMessageUndelivered);
            socket.off('messageEdit', onMessageEdit);
            socket.off('ticketStatusUpdate', onStatusUpdate);
        };
    }, [socket, channelID, session?.user]);

    useEffect(() => {
        markChannelAsRead(channelID);

        const onFocus = () => markChannelAsRead(channelID);
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [channelID]);

    // The écoute behind the channel: fetched again when its status changes, without reloading
    // the messages (they do not depend on it)
    const isTicket = status !== 0;
    useEffect(() => {
        if (!isTicket) return;
        let cancelled = false;
        apiFetch(`/v1/tickets/findBy/channelID`, {
            method: "POST",
            body: JSON.stringify({channelID}),
        }).then((d) => {
            if (!cancelled) setTicket(d.ticket);
        }).catch(() => {
        });
        return () => {
            cancelled = true;
        };
    }, [channelID, isTicket, status]);

    useEffect(() => {
        let cancelled = false;
        let timer: NodeJS.Timeout | null = null;
        // Backoff between failed loads: doubles up to 10 s (local, so each retry sees the last value)
        let delay = 1000;

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
                delay = 1000;

                // Fetch supplemental data after messages succeed (best-effort)
                apiFetch(`/v1/channel/${channelID}`)
                    .then((d) => {
                        if (!cancelled) setChannelName(d.name);
                    })
                    .catch(() => {
                    });

                apiFetch(`/v1/settings/ticket-categories`)
                    .then((data: { categories?: any[] }) => {
                        if (!cancelled && Array.isArray(data.categories)) setAvailableCategories(data.categories);
                    })
                    .catch(() => {
                    });

                loadAvailable();

            } catch (e) {
                if (cancelled) return;
                // Keep skeleton visible and retry with exponential backoff
                timer = setTimeout(() => {
                    if (!cancelled) load();
                }, delay);
                delay = Math.min(delay * 2, 10000);
            }
        };

        load();

        if (lastReadFetched.current !== channelID) {
            lastReadFetched.current = channelID;
            apiFetch(`/v1/channel/${channelID}/read`).then((res: any) => {
                if (res.lastRead) {
                    setLastReadTimestamp(new Date(res.lastRead).getTime());
                } else {
                    setLastReadTimestamp(null);
                }
            }).catch(() => setLastReadTimestamp(null));
        }

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
        }
    }, [channelID]);

    useEffect(() => {
        try {
            setChannelID(channelID);
        } catch {
        }
    }, [channelID, setChannelID]);

    useEffect(() => {
        apiFetch('/v1/auth/permissions')
            .then((d: { permissions?: string[] }) => {
                const perms = d.permissions ?? [];
                setCanAttribute(perms.includes('admin.sudo') || perms.includes('tickets.attribute'));
            })
            .catch(() => setCanAttribute(false));
    }, []);

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
                const wasAtBottom = isAtBottomRef.current;
                isAtBottomRef.current = distanceFromBottom <= 100;
                
                if (isAtBottomRef.current && !wasAtBottom) {
                    markChannelAsRead(channelID);
                    setLastReadTimestamp(null);
                }

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
    }, [hasMore, loadingOlder, loadingMessages, chat, channelID]);

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

    const FormSchema = z.object({
        volunteer: z.object({
            // `message` works with zod 3 and 4
            id: z.string({
                message: "Merci de sélectionner un Bénévole Écoutant",
            }),
            name: z.string(),
        }),
    });

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });

    /** Volunteers who may take this écoute now: present in the permanence, free, eligible. */
    function loadAvailable() {
        if (channelID === "1") return;
        apiFetch(`/v1/events/getAvailable?channelID=${channelID}`)
            .then((d: { id: string; name: string }[]) => {
                if (Array.isArray(d)) setAvailable(d.map(user => ({label: user.name, value: {id: user.id, name: user.name}})));
            })
            .catch(() => setAvailable([]));
    }

    function assign(data: z.infer<typeof FormSchema>) {
        if (!ticket?.id) {
            toast.error("L'écoute n'est pas encore chargée, réessayez dans un instant");
            return;
        }
        setAssigning(true);
        apiFetch(`/v1/tickets/assign`, {
            method: "POST",
            body: JSON.stringify({
                ticketID: ticket.id,
                assignmentID: data.volunteer.id
            }),
        }).then(res => {
            if (!res.success) throw new Error(res.error || "refused");
            toast.success(`L'écoute a été attribuée à ${data.volunteer.name}`);
            setTicket(prev => prev ? {...prev, assignedUserId: data.volunteer.id, statusName: "started"} : prev);
            setStatus(2);
            setAssignOpen(false);
            form.reset();
            socket?.emit('update');
        }).catch((e: Error) => {
            toast.error("L'écoute n'a pas été attribuée", {
                description: ({
                    "User cannot handle tickets": "Ce bénévole n'a pas les droits pour prendre une écoute.",
                    forbidden: "Vous n'avez pas le droit d'attribuer les écoutes.",
                    not_present: "Ce bénévole n'a pas rejoint la permanence.",
                    busy: "Ce bénévole est déjà en écoute : une seule à la fois.",
                } as Record<string, string>)[e.message] ?? e.message,
            });
        }).finally(() => setAssigning(false));
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
            if (!res.success) throw new Error(res.error || "refused");
            toast.success("Transmission envoyée");
            setTransmissionOpen(false);
            setTimeout(() => {
                router.push("/app/chat")
                socket?.emit('update')
            }, 2000)
        }).catch((e: Error) => {
            toast.error("La transmission n'a pas été envoyée", {description: e.message === "forbidden" ? "Vous n'avez pas accès à cette écoute." : e.message});
        })
    }

    const roleOrderAndLabels: Record<string, string> = {
        admin: "Administrateur",
        bot: "Robot",
        manager: "Référent Bénévole Écoutant",
        volunteer: "Bénévole Écoutant",
        training: "Bénévole en formation"
    };
    // Member list: each member sits under their highest configured role. The labels above are kept
    // for the default role names; any other (custom or renamed) role shows its own name.
    const NO_ROLE_GROUP = '';
    const roleWeight = new Map(configuredRoles.map(r => [r.name, r.weight]));
    const memberGroup = (role: string | string[]): string => {
        const names = (Array.isArray(role) ? role : String(role || '').split(','))
            .map(r => r.trim())
            .filter(r => roleWeight.has(r) && r !== 'none');
        if (!names.length) return NO_ROLE_GROUP;
        return names.reduce((best, r) => (roleWeight.get(r)! > roleWeight.get(best)! ? r : best));
    };
    const groupLabel = (group: string) => group === NO_ROLE_GROUP ? 'Membres' : (roleOrderAndLabels[group] || group);
    const groupIcon = (group: string) => {
        const name = configuredRoles.find(r => r.name === group)?.icon;
        return name ? (LucideIcons as any)[name] as React.ComponentType<{ className?: string }> | undefined : undefined;
    };

    return (
        <div className="flex flex-row items-center justify-center w-full">
            <div className="flex flex-col relative h-svh p-3 gap-4 w-full" ref={rootDivRef}>
                {/* The conversation: a live log, so screen readers announce new messages */}
                <div className="flex flex-col flex-grow overflow-y-auto" ref={messagesContainerRef}
                     role="log" aria-live="polite" aria-relevant="additions" aria-label={`Messages${channelName ? ` : ${channelName}` : ""}`}
                     aria-busy={loadingMessages || loadingOlder}>
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
                            {chat.map(({author, content, timestamp, reactions, id, replyID, edited, undelivered, internal}, key) => {
                                // Team note (identity revealed…): apart from the conversation, never seen by the person
                                if (internal) {
                                    return (
                                        <div key={id} role="note"
                                             className="mx-auto my-3 flex max-w-xl items-start gap-2 rounded-md border border-dashed border-destructive/40 px-3 py-2 text-sm">
                                            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden/>
                                            <div className="min-w-0">
                                                <p className="break-words">{content}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Note de l&apos;équipe, invisible pour la personne, le {new Date(timestamp).toLocaleString("fr-FR", {dateStyle: "short", timeStyle: "short"})}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }
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

                                const showUnreadBar = lastReadTimestamp && 
                                    currentDate > lastReadTimestamp && 
                                    (!prevDate || prevDate <= lastReadTimestamp) &&
                                    author.id !== session?.user.id;

                                return (
                                    <React.Fragment key={id}>
                                        {showUnreadBar && (
                                            <UnreadSeparator onSeen={() => setLastReadTimestamp(null)}/>
                                        )}
                                        <Message
                                            prevDate={prevDate as number}
                                            currentDate={currentDate}
                                            timestamp={timestamp}
                                            reactions={reactions as Reaction[]}
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
                                            undelivered={undelivered}
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
                                            readOnly={!!observation || status === 3 || status === 4}
                                        />
                                    </React.Fragment>
                                );
                            })}
                        </React.Fragment>
                    )}
                    <div className="pb-4"/>
                    <div ref={messagesListRef} className="h-px"/>
                </div>


                {
                    // Permanence chat (status 0): only its voice channel. Other channels: the écoute toolbar.
                    status === 0 ? (channelID !== "1" && (
                        <div className="absolute top-6 right-6 flex flex-row gap-2 z-20">
                            <SpectatePanel channelId={channelID} state={spectate} reload={reloadSpectate}/>
                            <PermanencePresence/>
                            <PermanenceVoiceControls channelId={channelID}/>
                        </div>
                    )) : observation ? (
                        <div className="absolute top-6 right-6 flex flex-row gap-2 z-20">
                            <ObservationBar request={observation} onEnded={reloadSpectate}/>
                        </div>
                    ) :
                        <div className="absolute top-6 right-6 flex flex-row gap-2 z-20">
                            <AlertDialog open={assignOpen} onOpenChange={(open) => {
                                setAssignOpen(open);
                                // Who joined or finished an écoute since the page was opened
                                if (open) loadAvailable();
                            }}>
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
                                                                        <CommandEmpty>
                                                                            {available.length === 0
                                                                                ? "Aucun bénévole disponible : les bénévoles doivent rejoindre la permanence et ne pas être déjà en écoute."
                                                                                : "Aucun bénévole trouvé"}
                                                                        </CommandEmpty>
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
                                                            Seuls les bénévoles présents à la permanence et libres sont proposés.
                                                            Le bénévole aura ensuite accès à l'écoute.
                                                        </FormDescription>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <Button type="submit" disabled={assigning}>Valider</Button>
                                            </AlertDialogFooter>
                                        </form>
                                    </Form>
                                </AlertDialogContent>
                            </AlertDialog>

                            {/* Voice: the écoute's one-to-one call */}
                            {channelID !== "1" && ticket && (
                                <TicketVoiceControls
                                    channelId={channelID}
                                    status={status}
                                    voice={!!ticket.voice}
                                    assignedUserId={ticket.assignedUserId}
                                    currentUserId={session?.user?.id}
                                    label={`Écoute ${String(ticket.id).padStart(5, "0")}`}
                                />
                            )}

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
                                    {canAttribute && ticket && !ticket.assignedUserId && (
                                        <div className="space-y-2 rounded-md border p-3 text-sm">
                                            <p>
                                                Personne n&apos;a été attribué à cette écoute : elle sera archivée directement,
                                                sans transmission, avec votre nom.
                                            </p>
                                            <Label htmlFor="close-reason">Motif (facultatif)</Label>
                                            <Textarea id="close-reason" rows={2} maxLength={500} value={closeReason}
                                                      placeholder="Ex. : la personne est partie avant la prise en charge"
                                                      onChange={(e) => setCloseReason(e.target.value)}/>
                                        </div>
                                    )}
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction asChild>
                                            <Button variant="destructive" onClick={() => {
                                                const archive = canAttribute && !!ticket && !ticket.assignedUserId;
                                                apiFetch('/v1/tickets/close', {
                                                    method: 'POST',
                                                    body: JSON.stringify({
                                                        channelID: channelID,
                                                        ...(archive ? {withoutTransmission: true, reason: closeReason.trim() || undefined} : {}),
                                                    })
                                                }).then(res => {
                                                    if (!res.success) throw new Error(res.error || "refused");
                                                    // Archived: no transmission to write
                                                    setStatus(archive ? 4 : 3)
                                                    setCloseReason("")
                                                    if (archive) toast.success("Écoute fermée et archivée");
                                                    socket?.emit('update')
                                                }).catch(() => toast.error("L'écoute n'a pas été fermée"))
                                            }}>
                                                Fermer l'écoute
                                            </Button>
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog open={transmissionOpen} onOpenChange={setTransmissionOpen}>
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
                                                <Button type="submit" disabled={transmissionForm.formState.isSubmitting}>Envoyer</Button>
                                            </AlertDialogFooter>
                                        </form>
                                    </Form>
                                </AlertDialogContent>
                            </AlertDialog>

                            <TicketInfoDialog channelId={channelID}/>
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

                    {observation ? (
                        <p className="w-full rounded-md border border-dashed px-4 py-3 text-center text-sm text-muted-foreground">
                            Vous observez cette écoute en lecture seule : vous ne pouvez pas écrire ni réagir.
                        </p>
                    ) : (
                    <form ref={formRef} onSubmit={(e) => sendForm(e)}
                          className='flex flex-row w-full gap-2 items-center'>
                        <div className="relative w-full">
                            {/* The browser's own spell checker underlines mistakes: drafts never leave Solar (#260) */}
                            <Textarea
                                placeholder={`Envoyer un message dans ${channelName}`}
                                aria-label={`Message${channelName ? ` dans ${channelName}` : ""}`}
                                onChange={(e) => {
                                    setCurrentMsg(e.target.value)
                                    sendTyping()
                                }}
                                disabled={status == 3 || status == 4}
                                ref={textRef}
                                onKeyDown={(e) => {
                                    // Enter sends, Shift+Enter goes to a new line; never while an input
                                    // method is still composing a word
                                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                                        e.preventDefault();
                                        formRef.current?.requestSubmit();
                                    }
                                }}
                                spellCheck
                                lang="fr"
                                value={currentMsg}
                                className="w-full flex flex-row outline-main outline-1 p-2 rounded-lg resize-none"
                            />
                        </div>

                        <Popover onOpenChange={setEmojiOpen} open={emojiOpen}>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" aria-label="Insérer un emoji" disabled={status == 3 || status == 4}>
                                    <Laugh aria-hidden/>
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
                                <Button type="button" variant="ghost" size="icon" aria-label="Insérer un GIF" disabled={status == 3 || status == 4}>
                                    <TvMinimalPlay aria-hidden/>
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

                        <Button type="submit" variant="ghost" size="icon" aria-label="Envoyer le message" disabled={status == 3 || status == 4}>
                            <Send aria-hidden/>
                        </Button>
                    </form>
                    )}
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
                                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" aria-label="Planning de l'événement">
                                    <Info className="h-4 w-4" aria-hidden/>
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
                        {onlineMemberCount} membre{onlineMemberCount >= 2 ? "s" : ""} connecté{onlineMemberCount >= 2 ? "s" : ""}
                    </small>
                </div>
                <div className="flex flex-col overflow-y-auto">
                    {Object.entries(
                        (() => {
                            // Only those who may see this channel; online if connected to Solar
                            const merged = allMembers.map(m => ({...m, isOnline: onlineIds.has(m.id)}));

                            const online = merged.filter(m => m.isOnline);
                            const offline = merged.filter(m => !m.isOnline);

                            const grouped = online.reduce((acc, user) => {
                                const roleKey = memberGroup(user.role);
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
                            // Highest role first, then members without a role, then offline
                            if (roleA === 'offline') return 1;
                            if (roleB === 'offline') return -1;
                            const wA = roleWeight.get(roleA) ?? -Infinity;
                            const wB = roleWeight.get(roleB) ?? -Infinity;
                            return wA === wB ? 0 : wB > wA ? 1 : -1;
                        }
                    ).map(([role, users]) => {
                        const sortedUsers = [...users].sort((a, b) => a.username.localeCompare(b.username));
                        const GroupIcon = role === 'offline' ? undefined : groupIcon(role);

                        return (
                            <div key={role} className="mb-4">
                                <h4 className="flex items-center gap-1.5 text-md font-semibold text-foreground/80 mb-2 capitalize">
                                    {GroupIcon && <GroupIcon className="h-4 w-4 text-muted-foreground"/>}
                                    {role === 'offline' ? 'Hors ligne' : groupLabel(role)} — {users.length}
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