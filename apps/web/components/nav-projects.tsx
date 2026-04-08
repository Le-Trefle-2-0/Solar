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
                                <a onClick={() => router.push(item.url)} className="cursor-pointer relative">
                                    {isActive && (
                                        <div className="absolute left-[-12px] h-1.5 w-1.5 rounded-full bg-primary"/>
                                    )}
                                    <item.icon/>
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
