"use server";

import {headers} from "next/headers";
import {auth} from "@/lib/auth";
import prisma from "@/lib/prisma";

/** Remembers that the signed-in user has seen (or skipped) the welcome tour (#82). */
export async function completeOnboardingAction() {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) return {error: "Unauthorized"};
    try {
        await prisma.user.update({where: {id: session.user.id}, data: {onboardedAt: new Date()}});
        return {success: true};
    } catch (e) {
        console.error("[completeOnboardingAction] Error:", e);
        return {error: "La visite n'a pas pu être enregistrée."};
    }
}
