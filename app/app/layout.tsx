import type {Metadata} from "next";
import {SidebarInset, SidebarProvider, SidebarTrigger} from "@/components/ui";
import {AppSidebar} from "@/components/app-sidebar";

export const metadata: Metadata = {
    title: "Solar - Le Trèfle 2.0",
    description: "Logiciel d'écoute",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (

        <SidebarProvider>
            <AppSidebar/>
            <SidebarInset>
                <SidebarTrigger className="-ml-1"/>
                <div className="max-h-full overflow-auto w-full">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
