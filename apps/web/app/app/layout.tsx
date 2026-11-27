import {SidebarProvider, SidebarTrigger} from "@/components/ui";
import {can, getAccess} from "@/lib/userPermissions";
import {AppSidebar} from "@/components/app-sidebar";
import {redirect} from "next/navigation";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {SocketProvider} from "@/context/Socket";
import {VoiceProvider} from "@/context/Voice";
import {DocumentSubmissionDialog} from "@/components/users/document-submission-dialog";
import {AccountOnHold} from "@/components/users/account-on-hold";
import {TwoFactorRequired} from "@/components/users/two-factor-required";
import {WelcomeTour} from "@/components/users/welcome-tour";
import {tourSteps} from "@/lib/onboarding";
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
    // Account managers (and the owner) may dismiss their own document reminder
    const access = await getAccess();
    const isAdmin = !!access && can(access.permissions, "management.manage_accounts");
    // The document dialog must not keep an account manager away from the settings where 2FA is enabled
    const maySkipDocDialog = !!access?.managesAccounts;

    let showDocDialog = false;
    let isRenewal = false;
    let isDismissible = false;
    let deadlineStr = "";

    // Administrative validation logic
    if (user.documentsStatus === 'missing' || user.documentsStatus === 'rejected') {
        if (!user.documentsRenewalAt || user.documentsStatus === 'rejected') {
            // Initial activation or rejected
            showDocDialog = true;
            isDismissible = maySkipDocDialog;
        } else {
            // Annual renewal request
            showDocDialog = true;
            isRenewal = true;
            const renewalRequestDate = new Date(user.documentsRenewalAt);
            const deadlineDate = addDays(renewalRequestDate, 14);
            deadlineStr = format(deadlineDate, "PP", {locale: fr});
            const daysSinceRenewalRequest = differenceInDays(new Date(), renewalRequestDate);

            if (maySkipDocDialog || daysSinceRenewalRequest < 14) {
                isDismissible = true;
            } else {
                isDismissible = false;
            }
        }
    }

    // Double check: Admin must ALWAYS be able to dismiss
    if (maySkipDocDialog) {
        isDismissible = true;
    }

    // Refused by the API (documents missing or refused, suspended): the app would only collect
    // "unauthorized" answers, so only the document dialog is shown, without sidebar nor realtime
    if (!access) {
        return (
            <>
                <AccountOnHold reason={showDocDialog ? "documents" : "suspended"}/>
                {showDocDialog && (
                    <DocumentSubmissionDialog open={true} isRenewal={isRenewal} deadline={deadlineStr} isDismissible={false}/>
                )}
            </>
        );
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

    // Accounts waiting for document review: only for those who review them
    const pendingDocsIds = isAdmin
        ? (await prisma.user.findMany({where: {documentsStatus: 'submitted'}, select: {id: true}})).map(u => u.id)
        : [];

    // Welcome tour until seen once, after any document dialog (#82)
    const showTour = !showDocDialog
        && !(await prisma.user.findUnique({where: {id: access.userId}, select: {onboardedAt: true}}))?.onboardedAt;

    return (
        <SocketProvider>
            <VoiceProvider>
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
                        {access.needsTwoFactor && <TwoFactorRequired/>}
                        {children}
                    </div>
                    {showTour && (
                        <WelcomeTour steps={tourSteps(access.permissions, access.needsTwoFactor)}
                                     needsTwoFactor={access.needsTwoFactor}/>
                    )}
                    {showDocDialog && (
                        <DocumentSubmissionDialog
                            open={true}
                            isRenewal={isRenewal}
                            deadline={deadlineStr}
                            isDismissible={isDismissible}
                        />
                    )}
                </SidebarProvider>
            </VoiceProvider>
        </SocketProvider>
    );
}
