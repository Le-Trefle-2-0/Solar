"use server";

import prisma from "@/lib/prisma";
import {revalidatePath} from "next/cache";
import {allowPublicAction, TOO_MANY_REQUESTS} from "@/lib/security/actionRateLimit";

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
// newsletters carry the subscriber's id instead (unsubscribeById).

export async function unsubscribeById(id: string) {
    if (!id) {
        return {success: false, error: "ID invalide"};
    }

    try {
        // Try to find and delete in NewsletterSubscriber
        const subscriber = await prisma.newsletterSubscriber.findUnique({
            where: {id},
        });

        if (subscriber) {
            await prisma.newsletterSubscriber.delete({
                where: {id},
            });
            revalidatePath("/");
            return {success: true, email: subscriber.email};
        }

        // If not found, try to find in User
        const user = await prisma.user.findUnique({
            where: {id},
        });

        if (user) {
            await prisma.user.update({
                where: {id},
                data: {newsletterSubscription: false}
            });
            revalidatePath("/");
            return {success: true, email: user.email};
        }

        // If neither found, it might have been already deleted/updated
        // We still return success: true but without an email to avoid "Abonné non trouvé" error
        return {success: true, alreadyUnsubscribed: true};
    } catch (error) {
        console.error("Newsletter unsubscription by ID error:", error);
        return {success: false, error: "Une erreur est survenue lors de la désinscription"};
    }
}
