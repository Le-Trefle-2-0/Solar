import type {Metadata} from "next";
import {SidebarProvider, SidebarTrigger} from "@/components/ui";
import {AppSidebar} from "@/components/app-sidebar";
import {redirect} from "next/navigation";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";

export const metadata: Metadata = {
    title: "Solar - Le Trèfle 2.0",
    description: "Logiciel d'écoute",
};

export default async function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) redirect('/auth/sign-in')
    return (
        <SidebarProvider>
            <AppSidebar className="border-r-main border-r"/>
            <div className="h-full w-full overflow-hidden">
                <SidebarTrigger className="fixed"/>
                    {children}
            </div>
        </SidebarProvider>
        // </div>
    );
}
