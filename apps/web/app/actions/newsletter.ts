"use server";

import prisma from "@/lib/prisma";
import {revalidatePath} from "next/cache";
import {allowPublicAction, TOO_MANY_REQUESTS} from "@/lib/security/actionRateLimit";
import {isValidUnsubscribe} from "@/lib/security/unsubscribeToken";

export async function subscribeToNewsletter(email: string) {
    if (!await allowPublicAction("newsletter")) return {success: false, error: TOO_MANY_REQUESTS};
    if (!email || !email.includes("@")) {
        return {success: false, error: "Email invalide"};
    }

    try {
        await prisma.newsletterSubscriber.upsert({
            where: {email},
            update: {},
            create: {email},
        });

        revalidatePath("/");
        return {success: true};
    } catch (error) {
        console.error("Newsletter subscription error:", error);
        return {success: false, error: "Une erreur est survenue lors de l'inscription"};
    }
}

// No unsubscription by e-mail address: anyone could unsubscribe anyone (#223). The links of the
// newsletters carry the recipient's id and its signature (#264); the address is never returned.

export async function unsubscribeById(id: string, signature: string) {
    if (!isValidUnsubscribe(id, signature)) {
        return {success: false, error: "Ce lien de désinscription n'est pas valide. Utilisez le lien du dernier e-mail reçu."};
    }

    try {
        const removed = await prisma.newsletterSubscriber.deleteMany({where: {id}});
        if (removed.count === 0) {
            await prisma.user.updateMany({where: {id}, data: {newsletterSubscription: false}});
        }
        revalidatePath("/");
        return {success: true};
    } catch (error) {
        console.error("Newsletter unsubscription by ID error:", error);
        return {success: false, error: "Une erreur est survenue lors de la désinscription"};
    }
}
