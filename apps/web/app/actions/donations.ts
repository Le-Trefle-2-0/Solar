"use server";

import {createHelloAssoCheckoutIntent} from "@/lib/helloasso";
import {z} from "zod";

const donationSchema = z.object({
    amount: z.number().min(1, "Le montant doit être d'au moins 1€"),
    isRecurring: z.boolean(),
});

export async function initiateDonation(data: z.infer<typeof donationSchema>) {
    const validated = donationSchema.safeParse(data);

    if (!validated.success) {
        return {error: "Données invalides"};
    }

    const {amount, isRecurring} = validated.data;
    const amountInCents = Math.round(amount * 100);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    if (!process.env.NEXT_PUBLIC_APP_URL) {
        console.warn("NEXT_PUBLIC_APP_URL is not set, falling back to http://localhost:3000");
    }
    // HelloAsso requires HTTPS for all redirect URLs (backUrl, errorUrl, returnUrl)
    const baseUrl = appUrl.startsWith("http://") ? appUrl.replace("http://", "https://") : appUrl;

    try {
        const intent = await createHelloAssoCheckoutIntent({
            totalAmount: amountInCents,
            itemName: isRecurring ? "Don mensuel Le Trefle 2.0" : "Don ponctuel Le Trefle 2.0",
            backUrl: `${baseUrl}/don`,
            errorUrl: `${baseUrl}/don?error=1`,
            returnUrl: `${baseUrl}/don/success`,
            containsDonation: true,
            initialAmount: amountInCents,
            metadata: {
                isRecurring: String(isRecurring),
                amount: String(amount)
            }
        });

        return {redirectUrl: intent.redirectUrl};
    } catch (error: any) {
        console.error("Failed to initiate donation:", error);
        return {error: error.message || "Une erreur est survenue lors de l'initialisation du don."};
    }
}
