"use server";

import {auth} from "@/lib/auth";
import {can, getAccess, getOwnerId, getRank, splitRoles} from "@/lib/userPermissions";
import {headers} from "next/headers";
import {z} from "zod";
import prisma from "@/lib/prisma";
import {hashPassword} from "better-auth/crypto";
import {randomBytes} from "crypto";
import {getResendClient} from "@/lib/resend";
import {renderEmailTemplate} from "@/lib/email-template";

import {truncateEmail} from "@/lib/utils";
import {broadcast} from "@/lib/broadcast";
import {canLinkFile, isFileId} from "@/lib/security/fileAccess";
import {escapeHtml} from "@/lib/security/escape";
import {purgeDocuments} from "@/lib/security/documentRetention";

const inviteSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    // No role = no access: stored as the hidden default role
    roles: z.array(z.string()),
});

const DOCUMENT_CHANGED = "Le document a changé depuis son ouverture : rechargez la page pour voir le nouveau fichier.";

/** The volunteer's current file differs from the one the reviewer examined (#254). */
function documentChanged(
    user: {idCardFileId: string | null; casierFileId: string | null},
    type: 'idCard' | 'casier' | 'all',
    examined: {idCard?: string | null; casier?: string | null},
): boolean {
    const kinds = type === 'all' ? ['idCard', 'casier'] as const : [type];
    return kinds.some(kind => (examined[kind] ?? null) !== (kind === 'idCard' ? user.idCardFileId : user.casierFileId));
}

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
    // Never used to sign in (a reset link is sent), but must not be guessable (#225)
    const tempPassword = randomBytes(24).toString("base64url");

    try {
        // 1. Create User and Account via Prisma to ensure reliability
        console.log(`[inviteAction] Creating user ${email}`);

        const userId = randomBytes(16).toString("hex");
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
                    id: randomBytes(16).toString("hex"),
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
                <p>Bonjour ${escapeHtml(name)},</p>
                <p>C'est un plaisir de vous accueillir sur la plateforme du Trèfle 2.0 !</p>
                <p>Votre compte a été créé avec succès par un administrateur.</p>
                <p>Dans quelques instants, vous allez recevoir un <strong>deuxième e-mail</strong> contenant un lien sécurisé pour définir votre mot de passe et accéder à votre espace.</p>
                <p><strong>Note importante :</strong> ce lien est valable pendant <strong>1 heure</strong>. Passé ce délai, vous pourrez en demander un nouveau avec « Mot de passe oublié » sur la page de connexion.</p>
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
        return {error: "L'invitation n'a pas pu être envoyée."};
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
        const file = isFileId(fileId)
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

        const previous = await prisma.user.findUnique({
            where: {id: session.user.id},
            select: {idCardFileId: true, casierFileId: true},
        });
        await prisma.user.update({
            where: {id: session.user.id},
            data: updateData,
        });
        // Replaced documents and abandoned uploads are deleted (#272)
        await purgeDocuments([session.user.id], [previous?.idCardFileId, previous?.casierFileId])
            .catch(e => console.error("[submitDocumentsAction] document purge failed:", e));

        await broadcast(null, 'documentsUpdate', {
            userId: session.user.id,
            status: 'submitted'
        });

        return {success: true};
    } catch (e: any) {
        console.error("[submitDocumentsAction] Error:", e);
        return {error: "Les documents n'ont pas pu être envoyés."};
    }
}

/**
 * Approves documents. `examinedFileIds` are the files the reviewer had on screen: if the volunteer
 * sent another file meanwhile, nothing is approved (#254).
 */
export async function validateDocumentsAction(
    userId: string,
    type: 'idCard' | 'casier' | 'all' = 'all',
    examinedFileIds: {idCard?: string | null; casier?: string | null} = {},
) {
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
        if (documentChanged(user, type, examinedFileIds)) return {error: DOCUMENT_CHANGED};

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
        return {error: "Les documents n'ont pas pu être validés."};
    }
}

export async function rejectDocumentAction(userId: string, type: 'idCard' | 'casier', reason: string, examinedFileId?: string | null) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const access = await getAccess();
    const isAuthorized = !!access && can(access.permissions, "management.manage_accounts");

    if (!session || !isAuthorized) {
        return {error: "Unauthorized"};
    }

    try {
        const user = await prisma.user.findUnique({where: {id: userId}, select: {idCardFileId: true, casierFileId: true}});
        if (!user) return {error: "User not found"};
        if (documentChanged(user, type, {[type]: examinedFileId})) return {error: DOCUMENT_CHANGED};
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
        // Refused documents cut access: open connections are checked again (#247)
        await broadcast(null, 'permissionsUpdate', {userId});

        return {success: true};
    } catch (e: any) {
        console.error("[rejectDocumentAction] Error:", e);
        return {error: "Le document n'a pas pu être refusé."};
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
        const previous = await prisma.user.findUnique({where: {id: userId}, select: {idCardFileId: true, casierFileId: true}});
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

        // The previous documents are no longer kept (#272)
        await purgeDocuments([userId], [previous?.idCardFileId, previous?.casierFileId])
            .catch(e => console.error("[requestRenewalAction] document purge failed:", e));

        await broadcast(null, 'documentsUpdate', {
            userId,
            status: 'missing'
        });

        return {success: true};
    } catch (e: any) {
        console.error("[requestRenewalAction] Error:", e);
        return {error: "Le renouvellement n'a pas pu être demandé."};
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

        const previous = await prisma.user.findMany({where: {id: {in: targets}}, select: {idCardFileId: true, casierFileId: true}});
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
        // The previous documents are no longer kept (#272)
        await purgeDocuments(targets, previous.flatMap(u => [u.idCardFileId, u.casierFileId]))
            .catch(e => console.error("[requestAllRenewalAction] document purge failed:", e));
        return {success: true};
    } catch (e: any) {
        console.error("[requestAllRenewalAction] Error:", e);
        return {error: "Le renouvellement n'a pas pu être demandé."};
    }
}

/** E-mail domain of removed accounts (never deliverable): such accounts are hidden from lists. */
const DELETED_EMAIL_DOMAIN = "@compte-supprime.invalid";

/**
 * Removes an account (#248). Requires management.manage_accounts; the owner, yourself and anyone
 * at or above your rank cannot be removed (Better Auth's own admin endpoints are disabled).
 *
 * The account is closed and emptied rather than deleted: its messages in écoutes and its planning
 * history must stay attributed to a volunteer (a message without an author is shown as the
 * visitor's). In one transaction: personal data, documents and roles are cleared, the account is
 * banned, sessions, passwords, passkeys, second factors and API keys are deleted, upcoming
 * registrations are removed and écoutes in progress go back to the queue. Then every open
 * connection of the account is closed.
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
        const now = new Date();
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: {id: userId},
                data: {
                    name: "Compte supprimé",
                    email: `supprime-${userId}${DELETED_EMAIL_DOMAIN}`,
                    emailVerified: false,
                    image: null,
                    username: null,
                    displayUsername: null,
                    role: "none",
                    banned: true,
                    banReason: "Compte supprimé",
                    banExpires: null,
                    twoFactorEnabled: false,
                    firstName: null,
                    lastName: null,
                    birthDate: null,
                    addressStreet: null,
                    addressNumber: null,
                    addressPostalCode: null,
                    addressCity: null,
                    documentsText: null,
                    idCardFileId: null,
                    idCardRejectReason: null,
                    casierFileId: null,
                    casierRejectReason: null,
                    updatedAt: now,
                },
            });
            await tx.session.deleteMany({where: {userId}});
            await tx.account.deleteMany({where: {userId}});
            await tx.passkey.deleteMany({where: {userId}});
            await tx.twoFactor.deleteMany({where: {userId}});
            await tx.apikey.deleteMany({where: {userId}});
            await tx.member.deleteMany({where: {userId}});
            await tx.eventRegistration.deleteMany({where: {userId, event: {start: {gt: now}}}});
            // Écoutes in progress go back to those waiting for a volunteer
            await tx.ticket.updateMany({
                where: {assignedUserId: userId, statusName: {in: ["waiting", "started"]}},
                data: {assignedUserId: null, statusName: "waiting", statusLabel: "Non-Assignée"},
            });
        });

        // A removed account keeps no identity document (#272)
        await prisma.file.deleteMany({where: {uploadedById: userId}})
            .catch(e => console.error("[removeUser] document purge failed:", e));

        // Check the result instead of assuming it (#248)
        const after = await prisma.user.findUnique({
            where: {id: userId},
            select: {banned: true, _count: {select: {sessions: true, accounts: true, apikeys: true, passkeys: true}}},
        });
        if (!after?.banned || Object.values(after._count).some(n => n > 0)) {
            return {error: "La suppression n'a pas pu être vérifiée. Réessayez."};
        }

        // Close the account's open WebSocket connections and refresh everyone's rights
        await broadcast(null, "permissionsUpdate", {userId});
        return {success: true};
    } catch (e) {
        console.error("[deleteUserAction] Error:", e);
        return {error: "La suppression a échoué."};
    }
}
