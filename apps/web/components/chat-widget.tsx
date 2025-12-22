"use client";
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {MessageCircle, Send, X} from 'lucide-react';
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
    const [socket, setSocket] = useState<Socket | null>(null);
    const [wsConnected, setWsConnected] = useState(false);

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
    const initSession = useCallback(async (): Promise<{ channelId: string, creds: any } | null> => {
        try {
            const res = await fetch('/api/widget/session', {method: 'POST'});
            if (!res.ok) return null;
            const data = await res.json();
            const cid = data?.channelId;
            const creds = data?.credentials;
            if (cid) {
                try {
                    localStorage.setItem('widget_channel_id', cid);
                } catch {
                }
            }
            return cid && creds ? {channelId: cid, creds} : null;
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
        (async () => {
            setLoading(true);
            if (!consented) {
                setLoading(false);
                return;
            }
            const session = await initSession();
            const cid = session?.channelId;
            const creds = session?.creds;
            if (cid) {
                setChannelId(cid);
                await loadMessages(cid);
                // Establish WS guest connection if credentials provided
                try {
                    const c = (session as any)?.creds;
                    if (c && c.channelId && c.uid && c.exp && c.sig) {
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
                            auth: {guest: c},
                            withCredentials: true,
                            reconnection: true,
                        });
                        setSocket(s);
                        s.on('connect', () => {
                            setWsConnected(true);
                            s.emit('listen', {id: cid});
                        });
                        s.on('disconnect', () => setWsConnected(false));
                        s.on('message', (data: any) => {
                            if (!data?.channel?.id || data.channel.id !== cid) return;
                            setMessages((prev) => {
                                if (typeof data.id !== 'undefined') {
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
                    }
                } catch {
                }
                startPolling(cid);
            }
            setLoading(false);
        })();
        return () => stopPolling();
    }, [open, consented, initSession, loadMessages, startPolling, stopPolling, visitorUserId, socket]);

    const handleSend = useCallback(async () => {
        if (!channelId || !input.trim()) return;
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
                // Optimistically append message locally
                setMessages((prev) => [...prev, {
                    id: data?.message?.id ?? Math.floor(Math.random() * 1e9),
                    author: {id: uid || 'me', name: 'Moi', image: null, role: null},
                    content: input.trim(),
                    timestamp: Date.now(),
                }]);
                // Also emit via WS to ensure volunteers get it instantly even if HTTP broadcast fails
                try {
                    const payload = {
                        id: data?.message?.id,
                        author: {id: uid || 'guest', image: null, name: 'Visiteur', role: null},
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
                    className="fixed top-auto bottom-5 right-5 left-auto z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90"
                    style={{top: 'auto', bottom: '1.25rem', right: '1.25rem', left: 'auto'}}
                >
                    <MessageCircle className="h-6 w-6"/>
                </button>
            )}

            {/* Panel */}
            {open && (
                <div
                    className="fixed top-auto bottom-5 right-5 left-auto z-50 w-[680px] sm:w-[720px] md:w-[760px] h-[80vh] min-h-[640px] rounded-2xl shadow-2xl"
                    style={{top: 'auto', bottom: '1.25rem', right: '1.25rem', left: 'auto'}}
                >
                    {/* Glassmorphism background layer for stronger readability */}
                    <div
                        className="absolute inset-0 bg-white/70 dark:bg-black/60 backdrop-blur-2xl border border-white/30 dark:border-white/10 rounded-2xl"
                        aria-hidden="true"/>

                    {/* Foreground content */}
                    <div className="relative z-10 flex flex-col w-full h-full overflow-hidden rounded-2xl">
                        <div
                            className="flex items-center justify-between px-4 py-3 border-b border-white/40 dark:border-white/10 bg-white/30 dark:bg-white/10 backdrop-blur-sm">
                            <div className="flex flex-col">
                                <span className="font-semibold">Support bénévole</span>
                                <span className="text-xs text-muted-foreground">Nous sommes à votre écoute</span>
                            </div>
                            <button onClick={() => setOpen(false)} aria-label="Close"
                                    className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5"/>
                            </button>
                        </div>

                        {/* Consent / intro step */}
                        {!consented ? (
                            <div className="flex-1 overflow-y-auto px-6 py-6">
                                <div className="mx-auto max-w-prose text-sm leading-relaxed">
                                    <p className="mb-3">
                                        Avant d’ouvrir un ticket, veuillez noter que les échanges sont protégés par le
                                        secret professionnel.
                                    </p>
                                    <p className="mb-4">
                                        Vos données sont traitées conformément à notre politique de confidentialité. En
                                        poursuivant, vous
                                        consentez à l’ouverture d’un ticket pour échanger avec un bénévole.
                                    </p>
                                    <a
                                        href="/politique-de-confidentialite"
                                        target="_blank"
                                        className="text-primary underline underline-offset-2"
                                        rel="noreferrer"
                                    >Consulter la politique de confidentialité</a>

                                    <div className="mt-6 flex items-center gap-3">
                                        <button
                                            onClick={async () => {
                                                // Mark consent and initialize session
                                                setConsented(true);
                                                try {
                                                    localStorage.setItem('widget_consent', '1');
                                                } catch {
                                                }
                                                setLoading(true);
                                                const session = await initSession();
                                                const cid = session?.channelId;
                                                if (cid) {
                                                    setChannelId(cid);
                                                    await loadMessages(cid);
                                                    // WS will be set by the effect reacting to `consented`
                                                }
                                                setLoading(false);
                                            }}
                                            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow"
                                        >Continuer et ouvrir le chat
                                        </button>
                                        <button
                                            onClick={() => setOpen(false)}
                                            className="rounded-lg border border-white/40 dark:border-white/10 bg-white/30 dark:bg-white/10 backdrop-blur px-4 py-2"
                                        >Annuler
                                        </button>
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
                              {new Date(m.timestamp).toLocaleTimeString()}
                            </span>
                                                    </div>
                                                    <div
                                                        className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div
                                    className="border-t border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/10 backdrop-blur-md p-4">
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
                                            className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md"
                                            aria-label="Envoyer"
                                        >
                                            <Send className="h-4 w-4"/>
                                        </button>
                                    </div>
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
