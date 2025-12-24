"use server";

import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {z} from "zod";
import prisma from "@/lib/prisma";
import {hashPassword} from "better-auth/crypto";

const inviteSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    roles: z.array(z.string()).min(1),
});

export async function inviteUserAction(formData: z.infer<typeof inviteSchema>) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
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

        // 2. Trigger Forget Password (which calls our sendResetPassword hook)
        console.log(`[inviteAction] Triggering forgetPassword for ${email}`);

        // Better Auth 1.4.6 uses forgetPassword on the client, but the server API 
        // operationId is requestPasswordReset for emailAndPassword plugin.
        const forgetPassword = (auth.api as any).forgetPassword || (auth.api as any).requestPasswordReset;

        if (typeof forgetPassword === "function") {
            await forgetPassword({
                body: {
                    email: email.toLowerCase(),
                    redirectTo: "/auth/reset-password",
                },
            });
        } else {
            console.error("[inviteAction] Could not find forgetPassword or requestPasswordReset on auth.api. Keys:", Object.keys(auth.api));
            throw new Error("Authentication API configuration error");
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

    if (!session || (session.user as any).role !== "admin") {
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

    if (!session || (session.user as any).role !== "admin") {
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

    if (!session || (session.user as any).role !== "admin") {
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

    if (!session || (session.user as any).role !== "admin") {
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
