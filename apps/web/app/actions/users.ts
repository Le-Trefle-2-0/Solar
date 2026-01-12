"use server";

import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {z} from "zod";
import prisma from "@/lib/prisma";
import {hashPassword} from "better-auth/crypto";
import {getResendClient} from "@/lib/resend";
import {renderEmailTemplate} from "@/lib/email-template";

const inviteSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    roles: z.array(z.string()).min(1),
});

export async function inviteUserAction(formData: z.infer<typeof inviteSchema>) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const userRole = (session?.user as any)?.role || "";
    const isAuthorized = userRole.split(",").some((r: string) => r === "admin" || r === "manager");

    if (!session || !isAuthorized) {
        return {error: "Unauthorized"};
    }

    const validated = inviteSchema.safeParse(formData);
    if (!validated.success) {
        return {error: "Invalid data"};
    }

    const {name, email, roles} = validated.data;
    const primaryRole = roles[0];
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);

    try {
        // 1. Create User and Account via Prisma to ensure reliability
        console.log(`[inviteAction] Creating user ${email}`);

        const userId = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        const hashedPassword = await hashPassword(tempPassword);

        const userData = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    id: userId,
                    email: email.toLowerCase(),
                    name,
                    emailVerified: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    role: roles.join(","),
                },
            });

            await tx.account.create({
                data: {
                    id: Math.random().toString(36).slice(2),
                    userId: user.id,
                    accountId: user.id,
                    providerId: "credential",
                    password: hashedPassword,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            return user;
        });

        // 2. Send Welcome Email
        console.log(`[inviteAction] Sending welcome email to ${email}`);
        const resend = getResendClient();
        const {html: welcomeHtml} = renderEmailTemplate({
            title: "Bienvenue sur Le Trèfle 2.0",
            content: `
                <p>Bonjour ${name},</p>
                <p>C'est un plaisir de vous accueillir sur la plateforme du Trèfle 2.0 !</p>
                <p>Votre compte a été créé avec succès par un administrateur.</p>
                <p>Dans quelques instants, vous allez recevoir un <strong>deuxième e-mail</strong> contenant un lien sécurisé pour définir votre mot de passe et accéder à votre espace.</p>
                <p><strong>Note importante :</strong> ce lien est valable pendant <strong>24 heures</strong>. Passé ce délai, vous pourrez en demander un nouveau sur la page de réinitialisation du mot de passe.</p>
                <p>À très vite sur Le Trèfle 2.0 !</p>
            `,
        });

        const {data: welcomeData, error: welcomeError} = await resend.emails.send({
            from: "Le Trèfle 2.0 <noreply@solar.letrefle.org>",
            to: email,
            subject: "Le Trèfle 2.0 - Bienvenue parmi nous !",
            html: welcomeHtml,
        });

        if (welcomeError) {
            console.error("[inviteAction] Welcome email error:", welcomeError);
        } else {
            console.log(`[inviteAction] Welcome email sent successfully: ${welcomeData?.id}`);
        }

        // Add a small delay to ensure the welcome email is processed first by the recipient's mail server
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 3. Trigger Password Reset via Better-Auth
        console.log(`[inviteAction] Triggering password reset for ${email}`);

        try {
            // @ts-ignore
            const api = auth.api;

            // Based on better-auth structure, we try to find the password reset function
            const forgetFn = api.requestPasswordReset

            if (typeof forgetFn === 'function') {
                await forgetFn({
                    body: {
                        email: email.toLowerCase(),
                        redirectTo: "/auth/reset-password",
                    },
                    headers: await headers()
                });
            } else {
                throw new Error("Could not find password reset function on auth.api");
            }
        } catch (authError: any) {
            console.error("[inviteAction] Auth API error:", authError);
            // We don't throw here because the user is already created and welcome email sent
            // but we should probably log it or handle it.
        }

        return {success: true, user: userData};
    } catch (e: any) {
        console.error("[inviteAction] Error:", e);
        return {error: e.message || "An error occurred during invitation"};
    }
}

export async function submitDocumentsAction(data: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    addressStreet?: string;
    addressNumber?: string;
    addressPostalCode?: string;
    addressCity?: string;
    idCardFileId?: string;
    casierFileId?: string;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return {error: "Unauthorized"};
    }

    try {
        const updateData: any = {
            documentsSentAt: new Date(),
            documentsStatus: "submitted",
        };

        if (data.firstName) updateData.firstName = data.firstName;
        if (data.lastName) updateData.lastName = data.lastName;
        if (data.birthDate) updateData.birthDate = new Date(data.birthDate);
        if (data.addressStreet) updateData.addressStreet = data.addressStreet;
        if (data.addressNumber) updateData.addressNumber = data.addressNumber;
        if (data.addressPostalCode) updateData.addressPostalCode = data.addressPostalCode;
        if (data.addressCity) updateData.addressCity = data.addressCity;

        if (data.idCardFileId) {
            updateData.idCardFileId = data.idCardFileId;
            updateData.idCardStatus = "submitted";
            updateData.idCardRejectReason = null;
        }
        if (data.casierFileId) {
            updateData.casierFileId = data.casierFileId;
            updateData.casierStatus = "submitted";
            updateData.casierRejectReason = null;
        }

        await prisma.user.update({
            where: {id: session.user.id},
            data: updateData,
        });
        return {success: true};
    } catch (e: any) {
        console.error("[submitDocumentsAction] Error:", e);
        return {error: e.message || "Failed to submit documents"};
    }
}

export async function validateDocumentsAction(userId: string, type: 'idCard' | 'casier' | 'all' = 'all') {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const userRole = (session?.user as any)?.role || "";
    const isAuthorized = userRole.split(",").some((r: string) => r === "admin" || r === "manager");

    if (!session || !isAuthorized) {
        return {error: "Unauthorized"};
    }

    try {
        const updateData: any = {};
        if (type === 'idCard' || type === 'all') {
            updateData.idCardStatus = "validated";
            updateData.idCardRejectReason = null;
        }
        if (type === 'casier' || type === 'all') {
            updateData.casierStatus = "validated";
            updateData.casierRejectReason = null;
        }

        // If both are validated, mark global status as validated
        const user = await prisma.user.findUnique({where: {id: userId}});
        if (!user) return {error: "User not found"};

        const newIdCardStatus = updateData.idCardStatus || user.idCardStatus;
        const newCasierStatus = updateData.casierStatus || user.casierStatus;

        if (newIdCardStatus === 'validated' && newCasierStatus === 'validated') {
            updateData.documentsStatus = "validated";
            updateData.documentsValidatedAt = new Date();
        }

        await prisma.user.update({
            where: {id: userId},
            data: updateData,
        });
        return {success: true};
    } catch (e: any) {
        console.error("[validateDocumentsAction] Error:", e);
        return {error: e.message || "Failed to validate documents"};
    }
}

export async function rejectDocumentAction(userId: string, type: 'idCard' | 'casier', reason: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const userRole = (session?.user as any)?.role || "";
    const isAuthorized = userRole.split(",").some((r: string) => r === "admin" || r === "manager");

    if (!session || !isAuthorized) {
        return {error: "Unauthorized"};
    }

    try {
        const updateData: any = {
            documentsStatus: "rejected"
        };
        if (type === 'idCard') {
            updateData.idCardStatus = "rejected";
            updateData.idCardRejectReason = reason;
        } else {
            updateData.casierStatus = "rejected";
            updateData.casierRejectReason = reason;
        }

        await prisma.user.update({
            where: {id: userId},
            data: updateData,
        });
        return {success: true};
    } catch (e: any) {
        console.error("[rejectDocumentAction] Error:", e);
        return {error: e.message || "Failed to reject document"};
    }
}

export async function requestRenewalAction(userId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const userRole = (session?.user as any)?.role || "";
    const isAuthorized = userRole.split(",").some((r: string) => r === "admin" || r === "manager");

    if (!session || !isAuthorized) {
        return {error: "Unauthorized"};
    }

    try {
        await prisma.user.update({
            where: {id: userId},
            data: {
                documentsRenewalAt: new Date(),
                documentsStatus: "missing", // Reset status to missing to trigger renewal UI
                idCardStatus: "missing",
                idCardFileId: null,
                idCardRejectReason: null,
                casierStatus: "missing",
                casierFileId: null,
                casierRejectReason: null,
            },
        });
        return {success: true};
    } catch (e: any) {
        console.error("[requestRenewalAction] Error:", e);
        return {error: e.message || "Failed to request renewal"};
    }
}

export async function requestAllRenewalAction() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const userRole = (session?.user as any)?.role || "";
    const isAuthorized = userRole.split(",").some((r: string) => r === "admin" || r === "manager");

    if (!session || !isAuthorized) {
        return {error: "Unauthorized"};
    }

    try {
        // Update all users who are not admins
        await prisma.user.updateMany({
            where: {
                role: {
                    not: {
                        contains: 'admin'
                    }
                }
            },
            data: {
                documentsRenewalAt: new Date(),
                documentsStatus: "missing",
                idCardStatus: "missing",
                idCardFileId: null,
                idCardRejectReason: null,
                casierStatus: "missing",
                casierFileId: null,
                casierRejectReason: null,
            },
        });
        return {success: true};
    } catch (e: any) {
        console.error("[requestAllRenewalAction] Error:", e);
        return {error: e.message || "Failed to request all renewal"};
    }
}
