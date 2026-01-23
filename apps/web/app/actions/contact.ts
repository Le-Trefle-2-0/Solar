"use server";

import {getResendClient} from "@/lib/resend";
import {z} from "zod";
import {renderEmailTemplate} from "@/lib/email-template";

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

    const {html} = renderEmailTemplate({
        title: "Nouveau message de contact",
        content: `
            <p><strong>Nom :</strong> ${name}</p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Téléphone :</strong> ${phoneDisplay}</p>
            <p><strong>Objet :</strong> ${subject}</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #8cc088; border-radius: 4px;">
                <strong>Message :</strong><br>
                ${text.replace(/\n/g, "<br>")}
            </div>
        `,
        footer: `Envoyé depuis le formulaire de contact de letrefle.org`
    });

    try {
        const {data, error} = await resend.emails.send({
            from: "Le Trèfle 2.0 <noreply@solar.letrefle.org>",
            to: "contact@letrefle.org",
            replyTo: email,
            subject: `Nouveau message depuis letrefle.org`,
            html,
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
