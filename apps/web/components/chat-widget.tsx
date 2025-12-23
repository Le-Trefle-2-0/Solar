"use client";
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {LogOut, MessageCircle, Send, X} from 'lucide-react';
import {apiFetch} from '@/lib/api';
import {io, Socket} from 'socket.io-client';

type Msg = {
    id: number;
    author: { id: string; name: string; image: string | null; role: string | null };
    content: string;
    timestamp: number;
};

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [consented, setConsented] = useState<boolean>(false);
    const [channelId, setChannelId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState('');
    const [polling, setPolling] = useState(false);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
    const [visitorUserId, setVisitorUserId] = useState<string | null>(null);
    const [visitorName, setVisitorName] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [ticketStatus, setTicketStatus] = useState<string>('waiting');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const clearLocalStorage = useCallback(() => {
        try {
            localStorage.removeItem('widget_user_id');
            localStorage.removeItem('widget_visitor_name');
            localStorage.removeItem('widget_consent');
            localStorage.removeItem('widget_channel_id');
        } catch {
        }
    }, []);

    const resetState = useCallback(() => {
        setConsented(false);
        setChannelId(null);
        setMessages([]);
        setTicketStatus('waiting');
        setVisitorUserId(null);
    }, []);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, []);

    useEffect(() => {
        if (open && consented) {
            scrollToBottom();
        }
    }, [messages, open, consented, scrollToBottom]);

    // Ensure we render outside of any transformed/overflow-hidden containers
    useEffect(() => {
        const el = document.createElement('div');
        el.id = 'chat-widget-portal';
        el.style.position = 'fixed'; // ensure it's its own stacking context
        el.style.zIndex = '9999';
        document.body.appendChild(el);
        setPortalEl(el);
        // Load any saved visitor id
        try {
            const saved = localStorage.getItem('widget_user_id');
            if (saved) setVisitorUserId(saved);
            const savedName = localStorage.getItem('widget_visitor_name');
            if (savedName) setVisitorName(savedName);
            const c = localStorage.getItem('widget_consent');
            if (c === '1') setConsented(true);
        } catch {
        }
        return () => {
            try {
                document.body.removeChild(el);
            } catch {
            }
        };
    }, []);

    // Initialize a public chat session: ensures a ticket + sets cookies + returns WS guest credentials
    const initSession = useCallback(async (name?: string): Promise<{
        channelId: string,
        creds: any,
        error?: string
    } | null> => {
        try {
            const res = await fetch('/api/widget/session', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name})
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || (data && !data.success)) {
                return data ? {channelId: '', creds: null, error: data.error} : null;
            }
            const cid = data?.channelId;
            const creds = data?.credentials;
            if (cid) {
                try {
                    localStorage.setItem('widget_channel_id', cid);
                } catch {
                }
            }
            return cid && creds ? {channelId: cid, creds} : {channelId: '', creds: null};
        } catch {
            return null;
        }
    }, []);

    const loadMessages = useCallback(async (cid: string) => {
        try {
            const data = await apiFetch(`/v1/messages/${cid}?limit=60`);
            setMessages(data || []);
        } catch (e) {
            // silent
        }
    }, []);

    const loadTicketStatus = useCallback(async (cid: string) => {
        try {
            const data = await apiFetch('/v1/tickets/findBy/channelID', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({channelID: cid}),
            });
            if (data?.success && data?.ticket?.statusName) {
                setTicketStatus(data.ticket.statusName);
            }
        } catch {
            // silent
        }
    }, []);

    const startPolling = useCallback((cid: string) => {
        if (pollRef.current) return;
        setPolling(true);
        pollRef.current = setInterval(() => loadMessages(cid), 3000);
    }, [loadMessages]);

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
        setPolling(false);
    }, []);

    useEffect(() => {
        if (!open) {
            stopPolling();
            // Disconnect socket when closing to avoid leaks
            if (socket) {
                try {
                    socket.disconnect();
                } catch {
                }
                setSocket(null);
                setWsConnected(false);
            }
            return;
        }

        // If we already have a socket connection, don't restart the whole process
        if (socket && wsConnected) return;

        (async () => {
            setLoading(true);
            if (!consented) {
                setLoading(false);
                return;
            }
            const session = await initSession();
            if (!session) {
                setLoading(false);
                return;
            }
            if (session.error === 'session_expired') {
                clearLocalStorage();
                resetState();
                setLoading(false);
                return;
            }
            const cid = session.channelId;
            const creds = session.creds;
            if (cid) {
                setChannelId(cid);
                await loadMessages(cid);
                await loadTicketStatus(cid);

                // Establish WS guest connection if credentials provided
                if (!socket) {
                    try {
                        if (creds && creds.channelId && creds.uid && creds.exp && creds.sig) {
                            // Build base WS URL with robust local fallback
                            const envUrl = process.env.NEXT_PUBLIC_WS_URL as string | undefined;
                            let base = envUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
                            if (typeof window !== 'undefined') {
                                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                                if (!envUrl && isLocal) base = 'http://localhost:5000';
                            }
                            if (base.startsWith('ws://')) base = 'http://' + base.slice('ws://'.length);
                            if (base.startsWith('wss://')) base = 'https://' + base.slice('wss://'.length);

                            const s = io(base, {
                                auth: {guest: creds},
                                withCredentials: true,
                                reconnection: true,
                                transports: ['websocket', 'polling'],
                            });

                            s.on('connect', () => {
                                setWsConnected(true);
                                s.emit('listen', {id: cid});
                            });
                            s.on('disconnect', () => setWsConnected(false));
                            s.on('ticketStatusUpdate', (data: any) => {
                                if (data?.channelId === cid && data?.statusName) {
                                    setTicketStatus(data.statusName);
                                    if (data.statusName === 'closed' || data.statusName === 'commented') {
                                        clearLocalStorage();
                                    }
                                }
                            });
                            s.on('message', (data: any) => {
                                if (!data?.channel?.id || data.channel.id !== cid) return;
                                setMessages((prev) => {
                                    if (data.id) {
                                        const exists = prev.some((m) => m.id === data.id);
                                        if (exists) return prev;
                                    }
                                    return [...prev, {
                                        id: data.id ?? Math.floor(Math.random() * 1e9),
                                        author: data.author,
                                        content: data.content,
                                        timestamp: data.timestamp || Date.now(),
                                    }].sort((a, b) => a.timestamp - b.timestamp);
                                });
                            });
                            setSocket(s);
                        }
                    } catch (e) {
                        console.error('[widget] WS connection error:', e);
                    }
                }
                startPolling(cid);
            }
            setLoading(false);
        })();
        return () => stopPolling();
    }, [open, consented, initSession, loadMessages, startPolling, stopPolling, socket, wsConnected]);

    const handleCloseTicket = useCallback(async () => {
        if (!channelId) return;
        if (!confirm('Voulez-vous vraiment fermer cette écoute ?')) return;

        try {
            const res = await fetch('/api/widget/close', {
                method: 'POST',
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setTicketStatus('closed');
                    clearLocalStorage();
                    // Close and reset immediately for a clean exit after manual close
                    setOpen(false);
                    resetState();
                }
            }
        } catch (e) {
            console.error('[widget] Error closing ticket:', e);
        }
    }, [channelId, clearLocalStorage, resetState]);

    const handleSend = useCallback(async () => {
        if (!channelId || !input.trim() || ticketStatus === 'closed' || ticketStatus === 'commented') return;
        try {
            const res = await fetch(`/api/messages/widget/${channelId}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({content: input.trim()}),
            });
            if (res.ok) {
                const data = await res.json().catch(() => null);
                // Persist visitor userId for labeling/alignment
                const uid: string | undefined = data?.message?.userId || data?.message?.userID;
                if (uid) {
                    setVisitorUserId(uid);
                    try {
                        localStorage.setItem('widget_user_id', uid);
                    } catch {
                    }
                }
                // Append message locally if not already present (handles race with WS)
                setMessages((prev) => {
                    const mid = data?.message?.id;
                    if (mid && prev.some(m => m.id === mid)) return prev;
                    return [...prev, {
                        id: mid ?? Math.floor(Math.random() * 1e9),
                        author: {id: uid || 'me', name: 'Moi', image: null, role: null},
                        content: input.trim(),
                        timestamp: Date.now(),
                    }];
                });
                // Also emit via WS to ensure volunteers get it instantly even if HTTP broadcast fails
                try {
                    const payload = {
                        id: data?.message?.id,
                        author: {id: uid || 'guest', image: null, name: 'utilisateur', role: null},
                        content: input.trim(),
                        timestamp: Date.now(),
                        channel: {id: channelId},
                        reactions: [],
                        replyID: null,
                        edited: false,
                    };
                    socket?.emit('sendMessage', payload);
                } catch {
                }
                setInput('');
                // If WS is not connected, refresh via polling immediately
                if (!wsConnected) await loadMessages(channelId);
            }
        } catch {
        }
    }, [channelId, input, loadMessages, socket, wsConnected]);

    const ui = (
        <>
            {/* Dimmed, blurred site overlay to improve readability when widget is open */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[8px]"
                    aria-hidden="true"
                    onClick={() => setOpen(false)}
                />
            )}
            {/* Floating button */}
            {!open && (
                <button
                    aria-label="Open support chat"
                    onClick={() => setOpen(true)}
                    className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200"
                >
                    <MessageCircle className="h-7 w-7"/>
                </button>
            )}

            {/* Panel */}
            {open && (
                <div
                    className="fixed inset-0 z-50 flex flex-col bg-background sm:bg-transparent sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[500px] md:w-[600px] lg:w-[700px] sm:h-[80vh] sm:min-h-[600px] sm:rounded-2xl sm:shadow-2xl overflow-hidden"
                >
                    {/* Glassmorphism background layer for stronger readability (desktop only) */}
                    <div
                        className="hidden sm:block absolute inset-0 bg-white/70 dark:bg-black/60 backdrop-blur-2xl border border-white/30 dark:border-white/10 rounded-2xl"
                        aria-hidden="true"/>

                    {/* Foreground content */}
                    <div
                        className="relative z-10 flex flex-col w-full h-full overflow-hidden sm:rounded-2xl bg-white dark:bg-zinc-950 sm:bg-transparent">
                        <div
                            className="flex items-center justify-between px-4 py-4 border-b border-white/40 dark:border-white/10 bg-white/30 dark:bg-white/10 backdrop-blur-sm">
                            <div className="flex flex-col">
                                <span className="font-semibold">Écoute</span>
                                <span className="text-xs text-muted-foreground">Cet espace d'échange est sécurisé et confidentiel</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {consented && ticketStatus !== 'closed' && ticketStatus !== 'commented' && (
                                    <button
                                        onClick={handleCloseTicket}
                                        title="Fermer l'écoute"
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                    >
                                        <LogOut className="h-3.5 w-3.5"/>
                                        <span className="hidden sm:inline">Fermer l'écoute</span>
                                    </button>
                                )}
                                <button onClick={() => {
                                    setOpen(false);
                                    if (ticketStatus === 'closed' || ticketStatus === 'commented') {
                                        resetState();
                                    }
                                }} aria-label="Close"
                                        className="text-muted-foreground hover:text-foreground">
                                    <X className="h-5 w-5"/>
                                </button>
                            </div>
                        </div>

                        {/* Consent / intro step */}
                        {!consented ? (
                            <div className="flex-1 overflow-y-auto px-6 py-6">
                                <div className="mx-auto max-w-prose text-sm leading-relaxed">
                                    <p className="mb-3">
                                        Avant d’ouvrir une écoute, veuillez noter que les échanges sont protégés par le
                                        secret professionnel.
                                    </p>
                                    <p className="mb-4">
                                        Vos données sont traitées conformément à notre politique de confidentialité. En
                                        poursuivant, vous
                                        consentez à l’ouverture d’une écoute pour échanger avec notre équipe de soutien
                                        moral.
                                    </p>
                                    <a
                                        href="/confidentialite"
                                        target="_blank"
                                        className="text-primary underline underline-offset-2"
                                        rel="noreferrer"
                                    >Consulter la politique de confidentialité</a>

                                    <div className="mt-8 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                            <button
                                                onClick={async () => {
                                                    // Mark consent and initialize session
                                                    setConsented(true);
                                                    const name = "Utilisateur";
                                                    setVisitorName(name);
                                                    try {
                                                        localStorage.setItem('widget_consent', '1');
                                                        localStorage.setItem('widget_visitor_name', name);
                                                    } catch {
                                                    }
                                                    setLoading(true);
                                                    const session = await initSession(name);
                                                    const cid = session?.channelId;
                                                    if (cid) {
                                                        setChannelId(cid);
                                                        await loadMessages(cid);
                                                        // WS will be set by the effect reacting to `consented`
                                                    }
                                                    setLoading(false);
                                                }}
                                                className="rounded-xl bg-primary px-6 py-3 text-primary-foreground shadow-lg font-medium hover:opacity-90 transition-opacity"
                                            >Continuer et ouvrir le chat
                                            </button>
                                            <button
                                                onClick={() => setOpen(false)}
                                                className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur px-6 py-3 font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                            >Annuler
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
                                    {loading && (
                                        <div className="text-sm text-muted-foreground">Connexion…</div>
                                    )}
                                    {!loading && messages.length === 0 && (
                                        <div className="text-sm text-muted-foreground">Démarrez la conversation, un
                                            bénévole vous répondra.</div>
                                    )}
                                    {messages.map((m) => {
                                        const isMe = visitorUserId && m.author?.id === visitorUserId;
                                        return (
                                            <div key={m.id}
                                                 className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div
                                                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-md ${isMe ? 'bg-primary text-primary-foreground' : 'bg-white/80 dark:bg-white/10 backdrop-blur-md border border-white/40 dark:border-white/10'} `}>
                                                    <div className="flex items-baseline gap-2 mb-1">
                            <span
                                className={`text-[10px] uppercase tracking-wide ${isMe ? 'opacity-90' : 'text-muted-foreground'}`}>
                              {isMe ? 'Moi' : 'Bénévole Écoutant'}
                            </span>
                                                        <span className="text-[10px] text-muted-foreground">
                              {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                            </span>
                                                    </div>
                                                    <div
                                                        className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef}/>
                                </div>

                                <div
                                    className="border-t border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/10 backdrop-blur-md p-4">
                                    {(ticketStatus === 'closed' || ticketStatus === 'commented') ? (
                                        <div className="text-center py-2 text-sm text-muted-foreground italic">
                                            Cette écoute est fermée. Vous ne pouvez plus envoyer de messages.
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Écrire un message…"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSend();
                                                }}
                                                className="flex-1 rounded-xl border border-white/40 dark:border-white/10 px-4 py-3 text-sm bg-white/60 dark:bg-white/10 backdrop-blur-md focus:outline-none"
                                            />
                                            <button
                                                onClick={handleSend}
                                                disabled={!input.trim()}
                                                className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md disabled:opacity-50 transition-opacity"
                                                aria-label="Envoyer"
                                            >
                                                <Send className="h-4 w-4"/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );

    if (!portalEl) return null;
    return createPortal(ui, portalEl);
}
