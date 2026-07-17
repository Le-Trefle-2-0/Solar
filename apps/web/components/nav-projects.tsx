"use client"

import {type LucideIcon,} from "lucide-react"
import {SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,} from "@/components/ui/sidebar"
import {usePathname, useRouter} from "next/navigation";

export function NavProjects({
                                projects,
                            }: {
    projects: {
        name: string
        url: string
        icon: LucideIcon
        hasNotification?: boolean
    }[]
}) {
    const router = useRouter()
    const pathname = usePathname()
    const {isMobile} = useSidebar()

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarMenu>
                {projects.map((item) => {
                    const isActive = pathname === item.url || (item.url !== '/app' && pathname.startsWith(item.url));
                    return (
                        <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton asChild isActive={isActive}>
                                <a onClick={() => router.push(item.url)} className="cursor-pointer relative flex items-center gap-2">
                                    {isActive && (
                                        <div className="absolute left-[-12px] h-1.5 w-1.5 rounded-full bg-primary"/>
                                    )}
                                    <div className="relative">
                                        <item.icon className="size-4 shrink-0" />
                                        {item.hasNotification && (
                                            <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                        )}
                                    </div>
                                    <span>{item.name}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}
