"use client"

import {type LucideIcon,} from "lucide-react"
import {SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem,} from "@/components/ui/sidebar"
import {usePathname, useRouter} from "next/navigation";
import {cn} from "@/lib/utils";

export function NavProjects({
                                projects,
                            }: {
    projects: {
        name: string
        url: string
        icon: LucideIcon
        /** Colour of the icon (tickets: their status). */
        iconClassName?: string
        /** Status read out after the name and shown on hover (tickets). */
        status?: string
        hasNotification?: boolean
        /** A voice call is going on (green dot). */
        live?: boolean
    }[]
}) {
    const router = useRouter()
    const pathname = usePathname()

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarMenu>
                {projects.map((item) => {
                    const isActive = pathname === item.url || (item.url !== '/app' && pathname.startsWith(item.url));
                    return (
                        <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton asChild isActive={isActive}>
                                <a onClick={() => router.push(item.url)}
                                   title={item.status ? `${item.name} : ${item.status}` : undefined}
                                   className="cursor-pointer relative flex min-w-0 items-center gap-2">
                                    {isActive && (
                                        <div className="absolute left-[-12px] h-1.5 w-1.5 rounded-full bg-primary"/>
                                    )}
                                    <div className="relative shrink-0">
                                        <item.icon className={cn("size-4 shrink-0", item.iconClassName)} aria-hidden/>
                                        {item.hasNotification && (
                                            <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                        )}
                                        {item.live && (
                                            <span className="absolute -bottom-1 -right-1 flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-sidebar"
                                                  title="Appel en cours" aria-label="Appel en cours"/>
                                        )}
                                    </div>
                                    <span className="truncate">{item.name}</span>
                                    {item.status && <span className="sr-only">, {item.status}</span>}
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}
