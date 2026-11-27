"use client";
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {CalendarClock, EyeOff, Heart, Lock, LogOut, MessageCircle, Send, X} from 'lucide-react';
import {apiFetch} from '@/lib/api';
import {io, Socket} from 'socket.io-client';
import {usePathname} from "next/navigation";
import {FeedbackForm} from "@/components/feedback-form";
import {VisitorCall} from "@/components/voice/visitor-call";
import {solvePow} from "@/lib/pow";
import {cn} from "@/lib/utils";

type Msg = {
    id: number;
    author: { id: string; name: string; image: string | null; role: string | null };
    content: string;
    timestamp: number;
};

const CLOSED_MESSAGE = "L'écoute a été fermée par le bénévole.";
const isEnded = (status: string) => status === 'closed' || status === 'commented';

/** Where the conversation stands, in the visitor's words. */
function statusLine(status: string): {text: string; tone: 'wait' | 'live' | 'done'} {
    if (isEnded(status)) return {text: 'Écoute terminée', tone: 'done'};
    if (status === 'started') return {text: 'Un bénévole vous répond', tone: 'live'};
    return {text: "En attente d'un bénévole", tone: 'wait'};
}

// disabled: the widget is switched off in Solar's settings, whatever the planning says
type Availability = {open: true; closesAt: string} | {open: false; nextOpening: {start: string; end: string} | null; disabled?: boolean};

/** "jeudi 27 novembre à 20:00" */
const formatOpening = (iso: string) => new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
});

export default function ChatWidget() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [consented, setConsented] = useState<boolean>(false);
    const [channelId, setChannelId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState('');
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
    const [visitorUserId, setVisitorUserId] = useState<string | null>(null);
    const [visitorCreds, setVisitorCreds] = useState<any>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [ticketStatus, setTicketStatus] = useState<string>('waiting');
    const [ticketId, setTicketId] = useState<number | null>(null);
    /** The volunteer switched this ticket to voice. */
    const [voice, setVoice] = useState(false);
    /** New écoutes can only be opened while a permanence is running. */
    const [availability, setAvailability] = useState<Availability | null>(null);
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
        setVoice(false);
    }, []);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, []);

    useEffect(() => {
        if (open && consented) scrollToBottom();
    }, [messages, open, consented, voice, scrollToBottom]);

    // Render outside of any transformed/overflow-hidden containers
    useEffect(() => {
        const el = document.getElementById('chat-widget-portal') || document.createElement('div');
        if (!el.id) {
            el.id = 'chat-widget-portal';
            el.style.position = 'fixed';
            el.style.top = '0';
            el.style.left = '0';
            el.style.width = '100%';
            el.style.height = '100%';
            el.style.pointerEvents = 'none';
            el.style.zIndex = '99999';
            document.body.appendChild(el);
        }
        setPortalEl(el);
        try {
            const saved = localStorage.getItem('widget_user_id');
            if (saved) setVisitorUserId(saved);
            if (localStorage.getItem('widget_consent') === '1') setConsented(true);
        } catch {
        }
        return () => {
            try {
                document.body.removeChild(el);
            } catch {
            }
        };
    }, []);

    // Close with Escape
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const loadMessages = useCallback(async (cid: string) => {
        try {
            const data = await apiFetch(`/v1/messages/widget/${cid}?limit=60`);
            setMessages(data || []);
        } catch {
            // silent
        }
    }, []);

    const loadTicketStatus = useCallback(async () => {
        try {
            const data = await apiFetch('/v1/widget/status');
            if (data?.success && data?.ticket) {
                if (data.ticket.statusName) setTicketStatus(data.ticket.statusName);
                if (data.ticket.id) setTicketId(data.ticket.id);
                setVoice(!!data.ticket.voice);
            }
        } catch {
            // silent
        }
    }, []);

    const loadAvailability = useCallback(async () => {
        try {
            setAvailability(await apiFetch('/v1/widget/availability'));
        } catch {
            setAvailability(null);
        }
    }, []);

    // While the window shows the consent (or closed) step, keep the opening state current
    useEffect(() => {
        if (!open || consented) return;
        loadAvailability();
        const id = setInterval(loadAvailability, 60_000);
        return () => clearInterval(id);
    }, [open, consented, loadAvailability]);

    // Public chat session: ensures a ticket, sets cookies, returns WS guest credentials
    const initSession = useCallback(async (name?: string, forceNew = false): Promise<{
        channelId: string,
        ticketId: number,
        creds: any,
        status?: string,
        error?: string
    } | null> => {
        try {
            const openSession = (pow?: object) => apiFetch('/v1/widget/session', {
                method: 'POST',
                body: JSON.stringify({name, forceNew, pow})
            });
            const res = await openSession().catch(async (err) => {
                if (err.message !== 'pow_required') throw err;
                return openSession(await solvePow(await apiFetch('/v1/widget/challenge')));
            });
            const cid = res?.channelId;
            if (cid) {
                try {
                    localStorage.setItem('widget_channel_id', cid);
                } catch {
                }
                loadMessages(cid);
                loadTicketStatus();
            }
            return cid && res?.credentials
                ? {channelId: cid, ticketId: res.ticketId, creds: res.credentials, status: res.status}
                : {channelId: '', ticketId: 0, creds: null};
        } catch (err: any) {
            if (err.message === 'session_expired') return {channelId: '', ticketId: 0, creds: null, error: 'session_expired'};
            if (err.message === 'permanence_closed' || err.message === 'widget_disabled') {
                return {channelId: '', ticketId: 0, creds: null, error: 'permanence_closed'};
            }
            return null;
        }
    }, [loadMessages, loadTicketStatus]);

    const startPolling = useCallback((cid: string) => {
        if (pollRef.current) return;
        pollRef.current = setInterval(() => loadMessages(cid), 3000);
    }, [loadMessages]);

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!open) {
            stopPolling();
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
            if (session.error === 'session_expired' || session.error === 'permanence_closed') {
                // No écoute to resume; when the service is closed the closed step is shown
                clearLocalStorage();
                resetState();
                if (session.error === 'permanence_closed') await loadAvailability();
                setLoading(false);
                return;
            }
            const {channelId: cid, creds, status, ticketId: tId} = session;
            setVisitorCreds(creds);
            if (status) setTicketStatus(status);
            if (tId) setTicketId(tId);
            if (creds?.uid) {
                setVisitorUserId(creds.uid);
                try {
                    localStorage.setItem('widget_user_id', creds.uid);
                } catch {
                }
            }
            if (cid) {
                setChannelId(cid);
                await loadMessages(cid);
                await loadTicketStatus();

                if (!socket && creds?.channelId && creds.uid && creds.exp && creds.sig) {
                    try {
                        const envUrl = process.env.NEXT_PUBLIC_WS_URL as string | undefined;
                        let base = envUrl || window.location.origin;
                        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                        if (!envUrl && isLocal) base = 'http://localhost:5000';
                        if (base.startsWith('ws://')) base = 'http://' + base.slice('ws://'.length);
                        if (base.startsWith('wss://')) base = 'https://' + base.slice('wss://'.length);

                        const s = io(base, {
                            path: '/socket.io/',
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
                            if (data?.channelId !== cid || !data?.statusName) return;
                            setTicketStatus(data.statusName);
                            if (isEnded(data.statusName)) {
                                setMessages((prev) => {
                                    if (prev.some(m => (m.author?.id === 'système' || m.author?.id === 'system') && m.content === CLOSED_MESSAGE)) return prev;
                                    return [...prev, {
                                        id: Math.floor(Math.random() * 1e9),
                                        author: {id: 'système', name: 'Système', image: null, role: null},
                                        content: CLOSED_MESSAGE,
                                        timestamp: Date.now(),
                                    }];
                                });
                            }
                        });
                        // The volunteer proposes to continue by voice, or ends the call (card removed)
                        s.on('ticketVoice', (data: any) => {
                            if (data?.channelId === cid) setVoice(data.voice !== false);
                        });
                        s.on('message', (data: any) => {
                            if (!data?.channel?.id || data.channel.id !== cid) return;
                            setMessages((prev) => {
                                if (data.id && prev.some((m) => m.id === data.id)) return prev;
                                let uidToCompare = visitorUserId || creds?.uid;
                                if (!uidToCompare) uidToCompare = localStorage.getItem('widget_user_id');
                                const isMe = (uidToCompare && data.author?.id === uidToCompare) || data.author?.name === 'Moi' || data.author?.name === 'Utilisateur';
                                return [...prev, {
                                    id: data.id ?? Math.floor(Math.random() * 1e9),
                                    author: data.author ? {
                                        ...data.author,
                                        name: isMe ? 'Moi' : 'Bénévole Écoutant',
                                        image: null,
                                    } : data.author,
                                    content: data.content,
                                    timestamp: data.timestamp || Date.now(),
                                }].sort((a, b) => a.timestamp - b.timestamp);
                            });
                        });
                        setSocket(s);
                    } catch (e) {
                        console.error('[widget] WS connection error:', e);
                    }
                }
                startPolling(cid);
            }
            setLoading(false);
        })();
        return () => stopPolling();
    }, [open, consented, initSession, loadMessages, loadTicketStatus, startPolling, stopPolling, socket, wsConnected, clearLocalStorage, resetState, visitorUserId, loadAvailability]);

    const handleCloseTicket = useCallback(async () => {
        if (!channelId) return;
        if (!confirm('Voulez-vous vraiment fermer cette écoute ?')) return;
        try {
            const res = await apiFetch('/v1/widget/close', {method: 'POST'});
            if (res.success) setTicketStatus('closed');
        } catch (e) {
            console.error('[widget] Error closing ticket:', e);
        }
    }, [channelId]);

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!channelId || !text || isEnded(ticketStatus)) return;
        try {
            const data = await apiFetch(`/v1/messages/widget/${channelId}`, {
                method: 'POST',
                body: JSON.stringify({content: text}),
            });
            const uid: string | undefined = data?.message?.userId || data?.message?.userID || data?.message?.author?.id;
            if (uid && uid !== visitorUserId) {
                setVisitorUserId(uid);
                try {
                    localStorage.setItem('widget_user_id', uid);
                } catch {
                }
            }
            setMessages((prev) => {
                const mid = data?.message?.id;
                if (mid && prev.some(m => m.id === mid)) return prev;
                return [...prev, {
                    id: mid ?? Math.floor(Math.random() * 1e9),
                    author: {id: uid || visitorUserId || visitorCreds?.uid || 'guest', name: 'Moi', image: null, role: null},
                    content: text,
                    timestamp: Date.now(),
                }].sort((a, b) => a.timestamp - b.timestamp);
            });
            setInput('');
            if (!wsConnected) await loadMessages(channelId);
        } catch (err: any) {
            // Switched off during the écoute: nothing can be sent any more, show the closed step
            if (err?.message === 'widget_disabled') {
                clearLocalStorage();
                resetState();
                await loadAvailability();
            }
        }
    }, [channelId, input, ticketStatus, loadMessages, visitorUserId, visitorCreds, wsConnected, clearLocalStorage, resetState, loadAvailability]);

    const openNewTicket = useCallback(async () => {
        setLoading(true);
        clearLocalStorage();
        resetState();
        const session = await initSession("Utilisateur", true);
        if (session?.error === 'permanence_closed') await loadAvailability();
        if (session?.channelId) {
            setConsented(true);
            setChannelId(session.channelId);
            setVisitorCreds(session.creds);
            setTicketStatus(session.status || 'waiting');
            setTicketId(session.ticketId || null);
            await loadMessages(session.channelId);
        }
        setLoading(false);
    }, [clearLocalStorage, resetState, initSession, loadMessages, loadAvailability]);

    const getVoiceToken = useCallback(async () => {
        const res = await apiFetch('/v1/widget/voice', {method: 'POST'});
        return res.token;
    }, []);

    const isMine = (m: Msg) => {
        let uid = visitorUserId || visitorCreds?.uid;
        if (!uid && typeof window !== 'undefined') uid = localStorage.getItem('widget_user_id');
        return (uid && m.author?.id === uid) || m.author?.name === 'Moi' || m.author?.name === 'Utilisateur';
    };
    const isSystem = (m: Msg) => m.author?.id === 'system' || m.author?.id === 'système';

    const line = statusLine(ticketStatus);
    const ended = isEnded(ticketStatus);

    const ui = (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-[9998] bg-black/30 pointer-events-auto"
                    aria-hidden="true"
                    onClick={() => setOpen(false)}
                />
            )}

            {!open && (
                <button
                    aria-label="Parler à un bénévole écoutant"
                    onClick={() => setOpen(true)}
                    // At rest only the icon; hovering or focusing it reveals the label
                    className="group fixed bottom-5 right-5 z-50 flex h-14 cursor-pointer items-center rounded-full bg-primary px-4 text-primary-foreground shadow-lg pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                    <MessageCircle className="size-6 shrink-0"/>
                    <span
                        aria-hidden="true"
                        className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-300 ease-out group-hover:ml-2 group-hover:max-w-56 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-56 group-focus-visible:opacity-100 motion-reduce:transition-none"
                    >
                        Parler à un bénévole écoutant
                    </span>
                </button>
            )}

            {open && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Écoute"
                    className="fixed inset-0 z-[10000] flex flex-col overflow-hidden bg-background pointer-events-auto sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(80vh,760px)] sm:w-[440px] sm:rounded-3xl sm:border sm:shadow-2xl"
                >
                    {/* Header: who you are talking to, and where the conversation stands */}
                    <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
                        <div className="min-w-0">
                            <h2 className="text-base font-semibold leading-tight">Écoute</h2>
                            {consented ? (
                                <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
                                    <span className={cn(
                                        "size-2 shrink-0 rounded-full",
                                        line.tone === 'live' && "bg-emerald-500",
                                        line.tone === 'wait' && "bg-amber-400",
                                        line.tone === 'done' && "bg-muted-foreground/40",
                                    )}/>
                                    {line.text}
                                </p>
                            ) : (
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {availability && !availability.open ? "Fermé pour le moment" : "Confidentiel et anonyme"}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {consented && !ended && (
                                <button
                                    onClick={handleCloseTicket}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    <LogOut className="size-3.5"/>
                                    Terminer
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    if (ended) resetState();
                                }}
                                aria-label="Fermer la fenêtre"
                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <X className="size-5"/>
                            </button>
                        </div>
                    </header>

                    {!consented && availability && !availability.open ? (
                        /* No permanence running: nobody can answer, so no écoute is opened */
                        <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
                            <CalendarClock className="size-8 text-primary" aria-hidden="true"/>
                            <h3 className="mt-4 text-xl font-semibold leading-snug">
                                {availability.disabled
                                    ? "Les écoutes en ligne sont suspendues pour le moment."
                                    : <>Aucun bénévole n&apos;est disponible pour le moment.</>}
                            </h3>
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                {availability.disabled
                                    ? "Vous ne pouvez pas écrire aux bénévoles depuis ce site en ce moment. Revenez un peu plus tard."
                                    : <>Les bénévoles vous écoutent pendant les permanences. Vous pourrez écrire ici
                                        dès le début de la prochaine.</>}
                            </p>
                            {!availability.disabled && <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
                                {availability.nextOpening ? (
                                    <>
                                        <p className="text-sm text-muted-foreground">Prochaine permanence</p>
                                        <p className="mt-0.5 font-semibold first-letter:uppercase">
                                            {formatOpening(availability.nextOpening.start)}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm">Aucune permanence n&apos;est programmée pour l&apos;instant.</p>
                                )}
                            </div>}
                            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                                En cas de danger immédiat, appelez le 112. Pour parler à quelqu&apos;un tout de suite,
                                le 3114 (prévention du suicide) répond jour et nuit, gratuitement.
                            </p>
                            <button
                                onClick={() => setOpen(false)}
                                className="mt-auto rounded-xl px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                Fermer
                            </button>
                        </div>
                    ) : !consented ? (
                        /* Consent: three reassurances, then one clear choice */
                        <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
                            <h3 className="text-xl font-semibold leading-snug">
                                Un bénévole formé peut vous écouter, sans jugement.
                            </h3>
                            <ul className="mt-6 space-y-4 text-sm leading-relaxed">
                                <li className="flex gap-3">
                                    <EyeOff className="mt-0.5 size-5 shrink-0 text-primary"/>
                                    <span>Vous restez anonyme : pas besoin de donner votre nom, et le bénévole ne voit pas qui vous êtes.</span>
                                </li>
                                <li className="flex gap-3">
                                    <Lock className="mt-0.5 size-5 shrink-0 text-primary"/>
                                    <span>Ce que vous dites reste confidentiel. Les bénévoles sont tenus au secret.</span>
                                </li>
                                <li className="flex gap-3">
                                    <Heart className="mt-0.5 size-5 shrink-0 text-primary"/>
                                    <span>Ce service est fait pour celles et ceux qui en ont besoin : merci de le respecter.</span>
                                </li>
                            </ul>
                            <p className="mt-6 text-xs text-muted-foreground">
                                En continuant, vous acceptez l&apos;ouverture d&apos;une écoute. {" "}
                                <a href="/confidentialite" target="_blank" rel="noreferrer"
                                   className="underline underline-offset-2 hover:text-foreground">
                                    Notre politique de confidentialité
                                </a>
                            </p>
                            <div className="mt-auto flex flex-col gap-2 pt-8">
                                <button
                                    onClick={() => {
                                        setConsented(true);
                                        try {
                                            localStorage.setItem('widget_consent', '1');
                                            localStorage.setItem('widget_visitor_name', 'Utilisateur');
                                        } catch {
                                        }
                                    }}
                                    className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                >
                                    Commencer la conversation
                                </button>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="rounded-xl px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    Pas maintenant
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5" aria-live="polite">
                                {loading && <p className="text-sm text-muted-foreground">Connexion…</p>}
                                {!loading && messages.length === 0 && !ended && (
                                    <div className="rounded-2xl bg-muted/60 px-4 py-3 text-sm leading-relaxed">
                                        Écrivez ce qui vous amène, avec vos mots. Un bénévole va vous répondre ici
                                        {ticketStatus === 'waiting' ? ' dès qu’il sera disponible.' : '.'}
                                    </div>
                                )}

                                {messages.map((m, idx) => {
                                    if (isSystem(m)) {
                                        const isLastSystem = !messages.slice(idx + 1).some(isSystem);
                                        return (
                                            <div key={m.id || idx} className="flex flex-col items-center gap-2 py-3">
                                                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                                                    {m.content}
                                                </span>
                                                {isLastSystem && ended && (
                                                    <button onClick={openNewTicket}
                                                            className="text-xs font-medium text-primary underline-offset-2 hover:underline">
                                                        Ouvrir une nouvelle écoute
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    }
                                    const mine = isMine(m);
                                    return (
                                        <div key={m.id || idx} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                                            <div className={cn(
                                                "max-w-[82%] px-4 py-2.5",
                                                mine
                                                    ? "rounded-2xl rounded-br-md bg-primary text-primary-foreground"
                                                    : "rounded-2xl rounded-bl-md border border-primary/30 bg-primary/15 text-foreground",
                                            )}>
                                                {!mine && <p className="mb-0.5 text-xs font-semibold text-foreground/70">Bénévole Écoutant</p>}
                                                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.content}</p>
                                                <p className={cn("mt-1 text-right text-[11px]", mine ? "text-primary-foreground/75" : "text-muted-foreground")}>
                                                    {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                {ended && ticketId && (
                                    <div className="border-t border-dashed pt-4">
                                        <FeedbackForm ticketID={ticketId}/>
                                    </div>
                                )}
                                <div ref={messagesEndRef}/>
                            </div>

                            {/* Voice: offered by the volunteer, never started by the page itself */}
                            {voice && ticketStatus === 'started' && (
                                <div className="px-4 pb-2">
                                    <VisitorCall getToken={getVoiceToken} compact/>
                                </div>
                            )}

                            <div className="border-t p-3">
                                {ended ? (
                                    <p className="py-2 text-center text-sm text-muted-foreground">
                                        Cette écoute est terminée.
                                    </p>
                                ) : (
                                    <form
                                        className="flex items-end gap-2"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleSend();
                                        }}
                                    >
                                        <label htmlFor="widget-input" className="sr-only">Votre message</label>
                                        <textarea
                                            id="widget-input"
                                            rows={1}
                                            placeholder="Écrire un message…"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend();
                                                }
                                            }}
                                            maxLength={2000}
                                            className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!input.trim()}
                                            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                            aria-label="Envoyer"
                                        >
                                            <Send className="size-4"/>
                                        </button>
                                    </form>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );

    if (!portalEl || pathname?.startsWith('/app') || pathname?.startsWith('/vocal')) return null;
    return createPortal(ui, portalEl);
}
