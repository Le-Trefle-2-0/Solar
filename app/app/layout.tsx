import type {Metadata} from "next";
import Nav from "@/components/nav/sidebar"

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
        <div className="flex h-screen">
            <Nav/>
            {children}
        </div>
    );
}
