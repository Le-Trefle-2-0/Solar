"use client"
import * as React from "react"
import {useEffect, useRef, useState} from "react"
import {
    CalendarDays,
    ChartLine,
    ChevronRight,
    Ear,
    History,
    House,
    Mail,
    MessageSquareMore,
    MessagesSquare,
    Phone,
    Settings,
    Shield,
    ShieldUser,
    Users,
} from "lucide-react"
import {NavProjects} from "@/components/nav-projects"
import {useParams} from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import Image from "next/image";
import {apiFetch} from "@/lib/api";
import logo from "@/public/logo.svg";
import {Socket} from "socket.io-client";
import {useSocket} from "@/context/Socket";
import {VoiceDock} from "@/components/voice/voice-dock";
import {isTicketCallLive, useVoiceStatus} from "@/hooks/use-voice-status";
import {UserButton} from "@/components/user-button";

export function AppSidebar({pendingDocsCount = 0, unreadChannelIds = [], pendingDocsIds = [], ...props}: React.ComponentProps<typeof Sidebar> & { pendingDocsCount?: number, unreadChannelIds?: string[], pendingDocsIds?: string[] }) {
    const {rooms: voiceRooms} = useVoiceStatus();
    const {socket} = useSocket();
    const [session, setSession] = useState<any>(null);
    const params = useParams();
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

    useEffect(() => {
        const path = window.location.pathname;
        if (path.startsWith('/app/ticket/')) {
            setActiveChannelId(path.split('/').pop() || null);
        } else if (path === '/app/be') {
            setActiveChannelId('1');
        } else if (path === '/app/chat') {
            setActiveChannelId('chat');
        } else {
            setActiveChannelId(null);
        }
    }, [params]);

    const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set(unreadChannelIds));
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set(pendingDocsIds));

    useEffect(() => {
        setUnreadIds(new Set(unreadChannelIds));
    }, [unreadChannelIds]);

    useEffect(() => {
        setPendingIds(new Set(pendingDocsIds));
    }, [pendingDocsIds]);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (data: any) => {
            const channelId = data.channel?.id;
            const authorId = data.author?.id;
            const currentUserId = session?.user?.id;
            console.log('[AppSidebar] Received message for channel:', channelId, 'Active channel:', activeChannelId, 'Author:', authorId, 'Me:', currentUserId);
            if (channelId && channelId !== activeChannelId && authorId !== currentUserId) {
                setUnreadIds(prev => {
                    const next = new Set(prev);
                    next.add(channelId);
                    console.log('[AppSidebar] Updated unreadIds:', Array.from(next));
                    return next;
                });
            }
        };

        const handleChannelRead = (data: any) => {
            console.log('[AppSidebar] Received channelRead event:', data);
            if (data.userId === session?.user?.id) {
                setUnreadIds(prev => {
                    const next = new Set(prev);
                    next.delete(data.channelId);
                    console.log('[AppSidebar] Cleared unreadId:', data.channelId, 'Remaining:', Array.from(next));
                    return next;
                });
            }
        };

        socket.on('message', handleMessage);
        socket.on('channelRead', handleChannelRead);

        const handleDocumentsUpdate = (data: any) => {
            console.log('[AppSidebar] Received documentsUpdate event:', data);
            setPendingIds(prev => {
                const next = new Set(prev);
                if (data.status === 'submitted') {
                    next.add(data.userId);
                } else {
                    next.delete(data.userId);
                }
                return next;
            });
        };
        socket.on('documentsUpdate', handleDocumentsUpdate);

        return () => {
            socket.off('message', handleMessage);
            socket.off('channelRead', handleChannelRead);
            socket.off('documentsUpdate', handleDocumentsUpdate);
        };
    }, [socket, activeChannelId, session]);

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
            hasNotification: unreadIds.has('1') && activeChannelId !== '1'
        },
        {
            name: "Chat Permanence",
            url: "/app/chat",
            icon: MessagesSquare,
            hasNotification: Array.from(unreadIds).some(id => id !== '1' && !id.startsWith('ticket-')) && activeChannelId !== 'chat'
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
            permission: "recruitments.manage",
        },
        {
            name: "Historique",
            url: "/app/admin/history",
            icon: History,
            permission: "management.ticket_history",
        },
        {
            name: "Utilisateurs",
            url: "/app/admin/users",
            icon: ShieldUser,
            permission: "management.manage_accounts",
            hasNotification: pendingDocsCount > 0
        },
        {
            name: "Statistiques",
            url: "/app/admin/stats",
            icon: ChartLine,
            permission: "management.view_stats",
        },
        {
            name: "Rôles",
            url: "/app/admin/roles",
            icon: Shield,
            permission: "roles.manage",
        },
        {
            name: "Paramètres",
            url: "/app/admin/settings",
            icon: Settings,
            permission: "settings.manage",
        },
        {
            name: "Newsletter",
            url: "/app/newsletters",
            icon: Mail,
            permission: "newsletters.manage",
        },
    ]
    const [tickets, setTickets] = useState<any[]>([]);

    useEffect(() => {
        const updateSession = () => apiFetch('/v1/auth/get-session').then(res => setSession(res));
        updateSession();

        if (!socket) return;
        socket.on('permissionsUpdate', updateSession);
        return () => {
            socket.off('permissionsUpdate', updateSession);
        };
    }, [socket]);

    const filteredBaseData = React.useMemo(() => {
        // Each restricted link names the permission its page requires (the owner holds them all)
        const permissions: string[] = (session?.user as any)?.permissions || [];
        const can = (p: string) => permissions.includes("admin.sudo") || permissions.includes(p);

        return baseData.filter(item => {
            const required = (item as any).permission as string | undefined;
            return !required || can(required);
        }).map(item => {
            if (item.name === "Discussion BE libre") {
                return { ...item, hasNotification: unreadIds.has('1') && activeChannelId !== '1' };
            }
            if (item.name === "Chat Permanence") {
                return { ...item, hasNotification: Array.from(unreadIds).some(id => id !== '1' && !id.startsWith('ticket-')) && activeChannelId !== 'chat' };
            }
            if (item.name === "Utilisateurs") {
                return { ...item, hasNotification: pendingIds.size > 0 };
            }
            return item;
        });
    }, [session, unreadIds, activeChannelId, pendingIds]);

    // Mark tickets whose call is going on (visible to supervisors and the assigned volunteer)
    const ticketsWithVoice = React.useMemo(
        () => tickets.map((t: any) => ({...t, live: isTicketCallLive(voiceRooms[t.channelId])})),
        [tickets, voiceRooms],
    );

    const MAX_TICKETS_BEFORE_COLLAPSE = 5;

    const updateTickets = () => {
        apiFetch(`/v1/tickets`)
            .then((res) => {
                if (res.success) {
                    const ticketList = res.tickets;
                    const items = ticketList.map((ticket: any) => {
                        const idStr = String(ticket.id).padStart(5, '0');
                        const displayName = `Écoute ${idStr}`;
                        return {
                            name: displayName,
                            url: '/app/ticket/' + ticket.channelId,
                            channelId: ticket.channelId,
                            // Voice tickets show a phone; a green dot while the call is going on
                            icon: ticket.voice ? Phone : Ear,
                            live: false,
                            hasNotification: unreadIds.has(ticket.channelId) && activeChannelId !== ticket.channelId
                        };
                    });
                    setTickets(items);
                }
            })
            .catch(err => console.error('Failed to load tickets:', err));
    }

    useEffect(() => {
        if (!socket) return;
        const onUpdateRequest = () => updateTickets();
        socket.on('updateRequest', onUpdateRequest);
        return () => {
            socket.off('updateRequest', onUpdateRequest);
        };
    }, [socket]);

    useEffect(() => {
        updateTickets()
    }, [session, unreadIds, activeChannelId]);

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
                <NavProjects projects={filteredBaseData}/>
                {tickets.length > 0 && (
                    <>
                        <SidebarSeparator/>
                        {tickets.length > MAX_TICKETS_BEFORE_COLLAPSE ? (
                            <SidebarMenu className="px-2">
                                <Collapsible asChild className="group/collapsible">
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip="Écoutes" className="relative">
                                                <Ear/>
                                                <span>Écoutes ({tickets.length})</span>
                                                {tickets.some(t => t.hasNotification) && (
                                                    <span className="absolute top-2 left-5 flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                                )}
                                                <ChevronRight
                                                    className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"/>
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {ticketsWithVoice.map((ticket: any) => (
                                                    <SidebarMenuSubItem key={ticket.name}>
                                                        <SidebarMenuSubButton asChild className="relative">
                                                            <a href={ticket.url}>
                                                                <span>{ticket.name}</span>
                                                                {ticket.live && (
                                                                    <Phone className="size-3 text-emerald-600" aria-label="Appel en cours"/>
                                                                )}
                                                                {ticket.hasNotification && (
                                                                    <span className="absolute top-1/2 -translate-y-1/2 right-2 flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                                                )}
                                                            </a>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            </SidebarMenu>
                        ) : (
                            <NavProjects projects={ticketsWithVoice}/>
                        )}
                    </>
                )}
            </SidebarContent>
            <SidebarFooter>
                {/* Voice connection (permanence voice channel or a voice ticket) */}
                <VoiceDock/>
                <UserButton/>
            </SidebarFooter>
        </Sidebar>
    )
}
