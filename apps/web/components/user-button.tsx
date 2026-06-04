"use client";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar} from "@/components/ui/sidebar";
import {authClient, useSession} from "@/lib/auth-client";
import {ChevronsUpDown, LogOut, Settings} from "lucide-react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

export function UserButton({className}: { className?: string }) {
    const {data: session} = useSession();
    const {isMobile} = useSidebar();
    const router = useRouter();

    if (!session) return null;

    const user = session.user;

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    toast.success("Déconnecté avec succès");
                    router.push("/auth/sign-in");
                },
            },
        });
    };

    return (
        <SidebarMenu className={className}>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border shadow-sm hover:bg-sidebar-accent transition-colors"
                        >
                            <Avatar className="h-8 w-8 rounded-lg border">
                                <AvatarImage src={user.image || ""} alt={user.name}/>
                                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-bold">
                                    {user.name?.slice(0, 2).toUpperCase() || "US"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-bold">{user.name}</span>
                                <span className="truncate text-xs text-muted-foreground font-medium">{user.email}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4 opacity-50"/>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg border">
                                    <AvatarImage src={user.image || ""} alt={user.name}/>
                                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-bold">
                                        {user.name?.slice(0, 2).toUpperCase() || "US"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{user.name}</span>
                                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator/>
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => router.push("/app/settings")}>
                                <Settings className="mr-2 size-4"/>
                                Paramètres
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                            <LogOut className="mr-2 size-4"/>
                            Se déconnecter
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
