import {UsersTable} from "./users-table"
import {DisplayAccount} from "@/lib/interface";
import prisma from "@/lib/prisma";
import {subDays} from "date-fns";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {constructMetadata} from "@/lib/metadata";
import {truncateEmail} from "@/lib/utils";
import {Page} from "@/components/ui";

async function getData(): Promise<DisplayAccount[]> {
    const hideEmails = process.env.HIDE_EMAILS_IN_ADMIN === "true";

    // Fetch data from your API here.
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
            Ticket: {
                where: {
                    createdAt: {
                        gte: subDays(new Date(), 90),
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 1, // latest ticket only
                select: {
                    createdAt: true,
                }
            },
        },
    });

    // Map user with the latest ticket date
    return accountsWithLatestTicket.map(acc => {
        return {
            id: acc.id,
            name: acc.name,
            username: acc.username as string,
            email: hideEmails ? truncateEmail(acc.email) : acc.email,
            role: acc.role as string,
            lastTicketTimestamp: acc.Ticket.length > 0 ? acc.Ticket[0].createdAt.getTime() : 0,
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
    });
}

export const metadata = constructMetadata({
    title: "Administration",
    noIndex: true,
});

export default async function Admin() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) redirect('/auth/sign-in');

    const userRoles = ((session.user as any).role || "").split(",").map((r: string) => r.trim());
    if (!userRoles.includes("admin") && !userRoles.includes("manager")) {
        redirect("/app");
    }

    const data = await getData()

    return (
        <Page title="Administration" description="Gérez les comptes utilisateurs et les accès">
            <UsersTable data={data}/>
        </Page>
    )
}