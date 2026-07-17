import {SidebarProvider, SidebarTrigger} from "@/components/ui";
import {AppSidebar} from "@/components/app-sidebar";
import {redirect} from "next/navigation";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {SocketProvider} from "@/context/Socket";
import {PeerProvider} from "@/context/VoicePeer";
import {DocumentSubmissionDialog} from "@/components/users/document-submission-dialog";
import {addDays, differenceInDays, format} from "date-fns";
import {fr} from "date-fns/locale";
import prisma from "@/lib/prisma";

import {constructMetadata} from "@/lib/metadata";

export const metadata = constructMetadata({
    title: "Solar - Le Trèfle 2.0",
    description: "Logiciel d'écoute",
    noIndex: true,
});

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) redirect('/auth/sign-in');

    const user = session.user as any;
    const userRoles = (user.role || "").split(",").map((r: string) => r.trim());
    const isAdmin = userRoles.includes("admin") || userRoles.includes("manager");

    let showDocDialog = false;
    let isRenewal = false;
    let isDismissible = false;
    let deadlineStr = "";

    // Administrative validation logic
    if (user.documentsStatus === 'missing' || user.documentsStatus === 'rejected') {
        if (!user.documentsRenewalAt || user.documentsStatus === 'rejected') {
            // Initial activation or rejected
            showDocDialog = true;
            isDismissible = isAdmin;
        } else {
            // Annual renewal request
            showDocDialog = true;
            isRenewal = true;
            const renewalRequestDate = new Date(user.documentsRenewalAt);
            const deadlineDate = addDays(renewalRequestDate, 14);
            deadlineStr = format(deadlineDate, "PP", {locale: fr});
            const daysSinceRenewalRequest = differenceInDays(new Date(), renewalRequestDate);

            if (isAdmin || daysSinceRenewalRequest < 14) {
                isDismissible = true;
            } else {
                isDismissible = false;
            }
        }
    }

    // Double check: Admin must ALWAYS be able to dismiss
    if (isAdmin) {
        isDismissible = true;
    }

    let pendingDocsCount = 0;
    if (isAdmin) {
        pendingDocsCount = await prisma.user.count({
            where: {
                documentsStatus: 'submitted'
            }
        });
    }

    // Unread messages logic
    const unreadChannels = await prisma.userChannelRead.findMany({
        where: { userId: user.id }
    });

    const channelLastReadMap = new Map(unreadChannels.map(ur => [ur.channelId, ur.lastRead]));

    const channels = await prisma.channel.findMany({
        select: {
            id: true,
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { createdAt: true, userId: true }
            }
        }
    });

    console.log('[Layout] Channels with latest messages:', JSON.stringify(channels, null, 2));
    console.log('[Layout] User ID:', user.id);
    console.log('[Layout] Channel last read map:', JSON.stringify(Array.from(channelLastReadMap.entries()), null, 2));

    const unreadChannelIds = channels
        .filter(c => {
            const lastRead = channelLastReadMap.get(c.id);
            const latestMessage = c.messages[0];
            // If no message ever, it's not unread
            if (!latestMessage) return false;
            // If we are the author of the latest message, it's not unread for us
            if (latestMessage.userId === user.id) return false;
            // If we never read it, and there is a message, it is unread
            if (!lastRead) return true;
            // If latest message is AFTER our last read, it is unread
            return latestMessage.createdAt > lastRead;
        })
        .map(c => c.id);

    console.log('[Layout] Calculated unreadChannelIds:', unreadChannelIds);

    const pendingDocs = await prisma.user.findMany({
        where: { documentsStatus: 'submitted' },
        select: { id: true }
    });
    const pendingDocsIds = pendingDocs.map(u => u.id);

    return (
        <SocketProvider>
            <PeerProvider>
                <SidebarProvider>
                    <AppSidebar
                        className="border-r-main border-r"
                        pendingDocsCount={pendingDocsCount}
                        unreadChannelIds={unreadChannelIds}
                        pendingDocsIds={pendingDocsIds}
                    />
                    <div className="flex flex-col h-full w-full overflow-hidden relative">
                        <SidebarTrigger
                            className="absolute top-2 left-2 z-50 bg-background/50 backdrop-blur shadow-sm border rounded-md"/>
                        {children}
                    </div>
                    {showDocDialog && (
                        <DocumentSubmissionDialog
                            open={true}
                            isRenewal={isRenewal}
                            deadline={deadlineStr}
                            isDismissible={isDismissible}
                        />
                    )}
                </SidebarProvider>
            </PeerProvider>
        </SocketProvider>
    );
}
