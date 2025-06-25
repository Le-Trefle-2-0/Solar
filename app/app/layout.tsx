import type {Metadata} from "next";
import {SidebarProvider, SidebarTrigger} from "@/components/ui";
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
            <AppSidebar className="border-r-main border-r"/>
            <div className="h-full w-full overflow-hidden">
                <SidebarTrigger className="fixed"/>
                    {children}
            </div>
        </SidebarProvider>
        // </div>
    );
}
