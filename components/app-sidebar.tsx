"use client"
import * as React from "react"
import {useEffect, useRef, useState} from "react"
import {CalendarDays, Ear, House, MessagesSquare, ShieldUser} from "lucide-react"
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
import logo from "@/public/logo.svg";
import {UserButton} from "@daveyplate/better-auth-ui";
import {Socket} from "socket.io-client";
import {useSocket} from "@/context/Socket";

export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
    const baseData = [
        {
            name: "Accueil",
            url: "/app",
            icon: House,
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
            name: "Administration",
            url: "/app/admin",
            icon: ShieldUser
        },
    ]
    const [data, setData] = useState([
        {
            name: "Accueil",
            url: "/app",
            icon: House,
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
            name: "Administration",
            url: "/app/admin",
            icon: ShieldUser
        },
    ]);
    const socketRef = useRef<Socket | null>(null);
    const {socket} = useSocket();

    const updateTickets = () => {
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tickets`)
            .then((res) => res.json())
            .then((ticketList) => {
                const items = ticketList.map((ticket: { channelName: string; channelId: string }) => ({
                    name: ticket.channelName,
                    url: '/app/ticket/' + ticket.channelId,
                    icon: Ear
                }));
                setData(data => [...baseData, ...items]);
            })
            .catch(err => console.error('Failed to load tickets:', err));
    }

    useEffect(() => {
        updateTickets()
    }, []);

    useEffect(() => {
        socket?.on('updateRequest', () => {
            updateTickets();
        })
    }, [socket]);

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
                <UserButton
                    className="w-full bg-white text-neutral-700 hover:bg-gray-50"/>
            </SidebarFooter>
        </Sidebar>
    )
}
