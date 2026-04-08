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
    } else if (user.documentsStatus === 'submitted') {
        if (!user.documentsValidatedAt || new Date(user.documentsSentAt) > new Date(user.documentsValidatedAt)) {
            const daysSinceSubmission = differenceInDays(new Date(), new Date(user.documentsSentAt));
            if (daysSinceSubmission >= 7) {
                // Not validated after 1 week
                showDocDialog = true;
                isDismissible = isAdmin;
            } else if (isAdmin) {
                // Admins are prompted at each login if not fully validated
                showDocDialog = true;
                isDismissible = true;
            }
        }
    } else if (isAdmin && user.documentsStatus !== 'validated') {
        // Any other non-validated status for admin
        showDocDialog = true;
        isDismissible = true;
    }

    // Double check: Admin must ALWAYS be able to dismiss
    if (isAdmin) {
        isDismissible = true;
    }

    return (
        <SocketProvider>
            <PeerProvider>
                <SidebarProvider>
                    <AppSidebar className="border-r-main border-r"/>
                    <div className="flex flex-col h-full w-full overflow-hidden">
                        <div className="flex items-center gap-2 px-6 pt-6 shrink-0">
                            <SidebarTrigger/>
                        </div>
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
