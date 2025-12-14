"use client"

import {type LucideIcon,} from "lucide-react"
import {SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,} from "@/components/ui/sidebar"
import {useRouter} from "next/navigation";

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
    const {isMobile} = useSidebar()

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarMenu>
                {projects.map((item) => (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild>
                            <a onClick={() => router.push(item.url)} className="cursor-pointer">
                                <item.icon/>
                                <span>{item.name}</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}
