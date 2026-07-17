import {UsersTable} from "../users-table";
import {DisplayAccount} from "@/lib/interface";
import prisma from "@/lib/prisma";
import {subDays} from "date-fns";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {constructMetadata} from "@/lib/metadata";
import {truncateEmail} from "@/lib/utils";
import {Page} from "@/components/ui";

async function getData(): Promise<{ users: DisplayAccount[], roles: any[] }> {
    const hideEmails = process.env.HIDE_EMAILS_IN_ADMIN === "true";

    const accountsWithLatestTicket = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            documentsStatus: true,
            documentsSentAt: true,
            documentsValidatedAt: true,
            documentsRenewalAt: true,
            documentsText: true,
            firstName: true,
            lastName: true,
            birthDate: true,
            addressStreet: true,
            addressNumber: true,
            addressPostalCode: true,
            addressCity: true,
            idCardFileId: true,
            idCardStatus: true,
            idCardRejectReason: true,
            casierFileId: true,
            casierStatus: true,
            casierRejectReason: true,
            tickets: {
                where: {
                    createdAt: {
                        gte: subDays(new Date(), 90),
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 1,
                select: {
                    createdAt: true,
                }
            },
        },
    });

    const roles = await prisma.role.findMany({
        orderBy: {weight: 'desc'}
    });

    return {
        users: accountsWithLatestTicket.map(acc => {
            return {
                id: acc.id,
                name: acc.name,
                username: acc.username as string,
                email: hideEmails ? truncateEmail(acc.email) : acc.email,
                role: acc.role as string,
                lastTicketTimestamp: acc.tickets.length > 0 ? acc.tickets[0].createdAt.getTime() : 0,
                documentsStatus: acc.documentsStatus,
                documentsSentAt: acc.documentsSentAt,
                documentsValidatedAt: acc.documentsValidatedAt,
                documentsRenewalAt: acc.documentsRenewalAt,
                documentsText: acc.documentsText,
                firstName: acc.firstName,
                lastName: acc.lastName,
                birthDate: acc.birthDate,
                addressStreet: acc.addressStreet,
                addressNumber: acc.addressNumber,
                addressPostalCode: acc.addressPostalCode,
                addressCity: acc.addressCity,
                idCardFileId: acc.idCardFileId,
                idCardStatus: acc.idCardStatus,
                idCardRejectReason: acc.idCardRejectReason,
                casierFileId: acc.casierFileId,
                casierStatus: acc.casierStatus,
                casierRejectReason: acc.casierRejectReason,
            };
        }),
        roles: roles.map(r => ({id: r.id, name: r.name, icon: r.icon}))
    };
}

export const metadata = constructMetadata({
    title: "Administration • Utilisateurs",
    noIndex: true,
});

export default async function AdminUsersPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) redirect('/auth/sign-in');

    const userRoles = ((session.user as any).role || "").split(",").map((r: string) => r.trim());
    const userPermissions = (session.user as any).permissions || [];
    const hasAccess = userRoles.includes("admin") ||
        userRoles.includes("manager") ||
        userPermissions.includes("management.manage_accounts") ||
        userPermissions.includes("admin.sudo");

    if (!hasAccess) {
        redirect("/app");
    }

    const {users, roles} = await getData()

    return (
        <Page title="Utilisateurs" description="Gérez les comptes utilisateurs et les accès">
            <UsersTable data={users} availableRoles={roles}/>
        </Page>
    )
}
