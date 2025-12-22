"use server";

import {getResendClient} from "@/lib/resend";
import {z} from "zod";

const contactSchema = z.object({
    name: z.string().min(1, "Le nom est obligatoire"),
    email: z.string().email("Email invalide"),
    phonePrefix: z.string().optional(),
    phoneNumber: z.string().optional(),
    subject: z.string().min(1, "L'objet est obligatoire"),
    text: z.string().min(1, "Le message est obligatoire"),
});

export async function sendContactEmail(formData: z.infer<typeof contactSchema>) {
    const validated = contactSchema.safeParse(formData);

    if (!validated.success) {
        return {error: "Données invalides"};
    }

    const {name, email, phonePrefix, phoneNumber, subject, text} = validated.data;

    const resend = getResendClient();

    const phoneDisplay = phoneNumber ? `${phonePrefix} ${phoneNumber}` : "Non renseigné";

    try {
        const {data, error} = await resend.emails.send({
            from: "noreply@solar.letrefle.org",
            to: "contact@letrefle.org",
            replyTo: email,
            subject: `[Contact Landing] ${subject}`,
            html: `
                <h2>Nouveau message de contact</h2>
                <p><strong>Nom :</strong> ${name}</p>
                <p><strong>Email :</strong> ${email}</p>
                <p><strong>Téléphone :</strong> ${phoneDisplay}</p>
                <p><strong>Objet :</strong> ${subject}</p>
                <p><strong>Message :</strong></p>
                <p>${text.replace(/\n/g, "<br>")}</p>
            `,
        });

        if (error) {
            console.error("Resend error:", error);
            return {error: `Erreur Resend: ${error.message}`};
        }

        return {success: true};
    } catch (error) {
        console.error("Failed to send contact email:", error);
        return {error: "Une erreur est survenue lors de l'envoi du message."};
    }
}
