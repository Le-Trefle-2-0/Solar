"use client"
import * as React from "react"
import {useEffect, useRef, useState} from "react"
import {
    Bot,
    CalendarDays,
    Ear,
    History,
    House,
    Mail,
    MessageSquareMore,
    MessagesSquare,
    Mic,
    MicOff,
    PhoneOff,
    ShieldUser,
    Signal,
    Users
} from "lucide-react"
import {NavProjects} from "@/components/nav-projects"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from "next/image";
import {apiFetch} from "@/lib/api";
import logo from "@/public/logo.svg";
import dynamic from "next/dynamic";
import {Socket} from "socket.io-client";
import {useSocket} from "@/context/Socket";
import {usePeer} from "@/context/VoicePeer";
// Disable SSR for UserButton to avoid hydration mismatches originating from
// client-only behavior (Radix IDs, image load state, timers, etc.).
const UserButton = dynamic(() => import("@daveyplate/better-auth-ui").then(m => m.UserButton), {ssr: false});

export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
    const {peerInstance, isMuted, toggleMute, stopCall, connectedUsers, netQuality, rttMs, lossPct} = usePeer();
    const baseData = [
        {
            name: "Accueil",
            url: "/app",
            icon: House,
        },
        {
            name: "Discussion BE libre",
            url: "/app/be",
            icon: MessageSquareMore,
        },
        {
            name: "Chat Permanence",
            url: "/app/chat",
            icon: MessagesSquare,
        },
        {
            name: "Planning",
            url: "/app/planning",
            icon: CalendarDays,
        },
        {
            name: "Recrutement",
            url: "/app/recruitments",
            icon: Users,
            adminOnly: true,
        },
        {
            name: "Bot",
            url: "/app/admin/bot",
            icon: Bot,
            adminOnly: true,
        },
        {
            name: "Historique",
            url: "/app/admin/history",
            icon: History,
            adminOnly: true,
        },
        {
            name: "Utilisateurs",
            url: "/app/admin",
            icon: ShieldUser,
            adminOnly: true,
        },
        {
            name: "Newsletter",
            url: "/app/newsletters",
            icon: Mail,
            newsletterOnly: true,
        },
    ]
    const [tickets, setTickets] = useState<any[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const {socket} = useSocket();

    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        apiFetch('/v1/auth/get-session').then(res => setSession(res));
    }, []);

    const filteredBaseData = React.useMemo(() => {
        if (!session) return baseData.filter(item => !(item as any).adminOnly);
        const roles = (session.user.role || "").split(",").map((r: string) => r.trim());
        const isAdmin = roles.includes("admin");
        const isManager = roles.includes("manager");
        const isNewsletterManager = roles.includes("newsletterManager");

        return baseData.filter(item => {
            if (!(item as any).adminOnly && !(item as any).newsletterOnly) return true;
            if (isAdmin) return true;
            if (isManager && (item.name === "Historique" || item.name === "Recrutement" || item.name === "Utilisateurs")) return true;
            if (isNewsletterManager && (item as any).newsletterOnly) return true;
            return false;
        });
    }, [session]);

    const data = React.useMemo(() => [...filteredBaseData, ...tickets], [filteredBaseData, tickets]);

    useEffect(() => {
        if (!socket) return;
        const onUpdateRequest = () => updateTickets();
        socket.on('updateRequest', onUpdateRequest);
        return () => {
            socket.off('updateRequest', onUpdateRequest);
        };
    }, [socket]);

    const updateTickets = () => {
        apiFetch(`/v1/tickets`)
            .then((res) => {
                if (res.success) {
                    const ticketList = res.tickets;
                    const items = ticketList.map((ticket: any) => {
                        let idStr = String(ticket.id).padStart(5, '0');
                        let displayName = `Ticket-${idStr}`;
                        return {
                            name: displayName,
                            url: '/app/ticket/' + ticket.channelId,
                            icon: Ear
                        };
                    });
                    setTickets(items);
                }
            })
            .catch(err => console.error('Failed to load tickets:', err));
    }

    useEffect(() => {
        updateTickets()
    }, [session]);

    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a>
                                <div
                                    className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">

                                    <Image src={logo} alt="logo" height={80}/>
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">Le Trèfle 2.0</span>
                                    <span className="truncate text-xs">Association d'écoute</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavProjects projects={data}/>
            </SidebarContent>
            <SidebarFooter>
                {/* Reserved area for voice controls to avoid flex layout shifts */}
                <div className="relative mb-2 h-12 w-full">
                    {peerInstance ? (
                        <div
                            className="flex h-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-2 shadow-none">
                            {/* Network indicator based on real network metrics */}
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const qualityColor = netQuality === 3 ? 'text-green-500' : netQuality === 2 ? 'text-amber-500' : netQuality === 1 ? 'text-red-500' : 'text-gray-400';
                                    const hint = `RTT: ${rttMs ?? '—'} ms, Loss: ${lossPct ?? '—'}%`;
                                    return (
                                        <div className={`flex items-center rounded p-1 ${qualityColor}`} title={hint}>
                                            <Signal size={18}/>
                                        </div>
                                    );
                                })()}
                                {/* Connected users count with hover dropdown (anchored to the count) */}
                                <div className="relative group">
                                    <span className="select-none text-xs text-gray-700"
                                          aria-label="Connected users count">{connectedUsers?.length ?? 0}</span>
                                    <div
                                        className="pointer-events-none absolute left-0 right-auto bottom-full mb-2 hidden min-w-40 rounded-md border border-gray-200 bg-white p-2 text-xs text-gray-700 shadow-sm group-hover:block group-hover:pointer-events-auto">
                                        <div className="mb-1 font-medium text-gray-900">Participants</div>
                                        {connectedUsers && connectedUsers.length > 0 ? (
                                            <ul className="list-disc pl-4">
                                                {connectedUsers.map((name, idx) => (
                                                    <li key={idx}>{name}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="text-gray-500">Aucun participant</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={toggleMute}
                                    className={`rounded p-2 text-gray-700 transition-colors hover:bg-gray-100 ${isMuted ? 'text-red-600' : ''}`}
                                    title={isMuted ? 'Unmute' : 'Mute'}
                                    aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                                >
                                    {isMuted ? <MicOff size={18}/> : <Mic size={18}/>}
                                </button>
                                <button
                                    onClick={stopCall}
                                    className="rounded p-2 text-red-600 transition-colors hover:bg-red-50"
                                    title="Disconnect"
                                    aria-label="Disconnect call"
                                >
                                    <PhoneOff size={18}/>
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Blank placeholder to preserve layout when not connected
                        <div className="h-full rounded-md border border-transparent bg-transparent"/>
                    )}
                </div>
                <UserButton
                    className="w-full bg-white text-neutral-700 hover:bg-gray-50"/>
            </SidebarFooter>
        </Sidebar>
    )
}
