"use server";

import {auth} from "@/lib/auth";
import {can, getAccess, getOwnerId, getRank, splitRoles} from "@/lib/userPermissions";
import {headers} from "next/headers";
import {z} from "zod";
import prisma from "@/lib/prisma";
import {hashPassword} from "better-auth/crypto";
import {getResendClient} from "@/lib/resend";
import {renderEmailTemplate} from "@/lib/email-template";

import {truncateEmail} from "@/lib/utils";
import {broadcast} from "@/lib/broadcast";
import {canLinkFile} from "@/lib/security/fileAccess";

const inviteSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    // No role = no access: stored as the hidden default role
    roles: z.array(z.string()),
});

export async function inviteUserAction(formData: z.infer<typeof inviteSchema>) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const access = await getAccess();
    const isAuthorized = !!access && can(access.permissions, "management.manage_accounts");

    if (!session || !isAuthorized) {
        return {error: "Unauthorized"};
    }

    const validated = inviteSchema.safeParse(formData);
    if (!validated.success) {
        return {error: "Invalid data"};
    }

    const {name, email} = validated.data;
    const chosen = validated.data.roles.filter((r) => r !== "none");
    const roles = chosen.length ? chosen : ["none"];

    // Same rule as POST /v1/admin/users/:id/role: only existing roles, and below the inviter's own.
    const knownRoles = await prisma.role.findMany({select: {name: true, weight: true}});
    const weights = new Map(knownRoles.map((r) => [r.name, r.weight]));
    // An empty name would be read back as the default role
    if (!roles.every((r) => r.length > 0 && !r.includes(",") && r === r.trim() && weights.has(r))) {
        return {error: "Invalid data"};
    }
    // Handing out roles needs roles.manage, and only roles strictly below the inviter's rank
    // (the owner ranks above every role). Same rule as POST /v1/admin/users/:id/role.
    if (roles.some((r) => r !== "none") && !can(access!.permissions, "roles.manage")) {
        return {error: "Unauthorized"};
    }
    const inviterRank = await getRank(access!.userId, access!.role);
    if (roles.some((r) => weights.get(r)! >= inviterRank)) {
        return {error: "Unauthorized"};
    }

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
            const api = auth.api;

            // Based on better-auth structure, we try to find the password reset function
            const forgetFn = api.requestPasswordReset

            if (typeof forgetFn === 'function') {
                await forgetFn({
                    body: {
                        email: email.toLowerCase(),
                        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
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

        const hideEmails = process.env.HIDE_EMAILS_IN_ADMIN === "true";
        if (hideEmails) {
            userData.email = truncateEmail(userData.email);
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

    // Only files this user uploaded may be attached to their profile (#211)
    for (const fileId of [data.idCardFileId, data.casierFileId]) {
        if (fileId === undefined) continue;
        const file = typeof fileId === "string"
            ? await prisma.file.findUnique({where: {id: fileId}, select: {uploadedById: true}})
            : null;
        if (!canLinkFile(session.user.id, file)) {
            return {error: "Invalid file"};
        }
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

        await broadcast(null, 'documentsUpdate', {
            userId: session.user.id,
            status: 'submitted'
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

    const access = await getAccess();
    const isAuthorized = !!access && can(access.permissions, "management.manage_accounts");

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

        await broadcast(null, 'documentsUpdate', {
            userId,
            status: updateData.documentsStatus || 'partial'
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

    const access = await getAccess();
    const isAuthorized = !!access && can(access.permissions, "management.manage_accounts");

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

        await broadcast(null, 'documentsUpdate', {
            userId,
            status: 'rejected'
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

    const access = await getAccess();
    const isAuthorized = !!access && can(access.permissions, "management.manage_accounts");

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

        await broadcast(null, 'documentsUpdate', {
            userId,
            status: 'missing'
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

    const access = await getAccess();
    const isAuthorized = !!access && can(access.permissions, "management.manage_accounts");

    if (!session || !isAuthorized) {
        return {error: "Unauthorized"};
    }

    try {
        // Everyone except the owner and holders of a role with admin.sudo
        // (decided by permission, not by a role being called "admin")
        const [users, roleRows, ownerId] = await Promise.all([
            prisma.user.findMany({select: {id: true, role: true}}),
            prisma.role.findMany({select: {name: true, permissions: true}}),
            getOwnerId(),
        ]);
        const sudoRoles = new Set(roleRows.filter((r) => {
            try {
                return (JSON.parse(r.permissions || "[]") as unknown[]).includes("admin.sudo");
            } catch {
                return false;
            }
        }).map((r) => r.name));
        const targets = users
            .filter((u) => u.id !== ownerId && !splitRoles(u.role).some((r) => sudoRoles.has(r)))
            .map((u) => u.id);

        await prisma.user.updateMany({
            where: {id: {in: targets}},
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

/**
 * Deletes an account. Requires management.manage_accounts; the owner, yourself and anyone
 * at or above your rank cannot be deleted (Better Auth's own admin endpoints are disabled).
 */
export async function deleteUserAction(userId: string) {
    const access = await getAccess();
    if (!access || !can(access.permissions, "management.manage_accounts")) return {error: "Unauthorized"};
    if (typeof userId !== "string" || !userId) return {error: "Invalid data"};
    if (userId === access.userId) return {error: "Vous ne pouvez pas supprimer votre propre compte."};

    const target = await prisma.user.findUnique({where: {id: userId}, select: {id: true, role: true}});
    if (!target) return {error: "Utilisateur introuvable."};
    if (target.id === await getOwnerId()) return {error: "Le propriétaire de l'application ne peut pas être supprimé."};
    if (await getRank(target.id, target.role) >= await getRank(access.userId, access.role)) {
        return {error: "Vous ne pouvez pas supprimer un membre de rang égal ou supérieur."};
    }

    try {
        await prisma.user.delete({where: {id: userId}});
        return {success: true};
    } catch (e) {
        console.error("[deleteUserAction] Error:", e);
        return {error: "La suppression a échoué."};
    }
}
