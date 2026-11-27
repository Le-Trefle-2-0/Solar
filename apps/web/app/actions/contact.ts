"use server";

import {getResendClient} from "@/lib/resend";
import {z} from "zod";
import {renderEmailTemplate} from "@/lib/email-template";
import {allowPublicAction, TOO_MANY_REQUESTS} from "@/lib/security/actionRateLimit";
import {emailSubject, escapeHtml} from "@/lib/security/escape";

const contactSchema = z.object({
    name: z.string().trim().min(1, "Le nom est obligatoire").max(100),
    email: z.string().email("Email invalide").max(254),
    phonePrefix: z.string().max(8).optional(),
    phoneNumber: z.string().max(30).optional(),
    subject: z.string().trim().min(1, "L'objet est obligatoire").max(150),
    text: z.string().min(1, "Le message est obligatoire").max(5000),
});

export async function sendContactEmail(formData: z.infer<typeof contactSchema>) {
    if (!await allowPublicAction("contact")) return {error: TOO_MANY_REQUESTS};
    const validated = contactSchema.safeParse(formData);

    if (!validated.success) {
        return {error: "Données invalides"};
    }

    const {name, email, phonePrefix, phoneNumber, subject, text} = validated.data;

    const resend = getResendClient();

    // Everything typed by the visitor is shown as text, never as markup (#222)
    const phoneDisplay = phoneNumber ? escapeHtml(`${phonePrefix ?? ""} ${phoneNumber}`.trim()) : "Non renseigné";

    const {html} = renderEmailTemplate({
        title: `Nouveau message de contact`,
        content: `
            <div style="margin-bottom: 20px;">
                <strong>De :</strong> ${escapeHtml(name)} (&lt;${escapeHtml(email)}&gt;)<br>
                <strong>Téléphone :</strong> ${phoneDisplay}<br>
                <strong>Sujet :</strong> ${escapeHtml(subject)}<br>
                <strong>Date :</strong> ${new Date().toLocaleString("fr-FR")}
            </div>
            <div style="padding: 15px; background-color: #f9f9f9; border-left: 4px solid #8cc088; font-style: italic;">
                <strong>Message :</strong><br>
                ${escapeHtml(text, {lineBreaks: true})}
            </div>
        `,
        footer: `Ce message a été envoyé via le formulaire de contact de letrefle.org`
    });

    try {
        const {error} = await resend.emails.send({
            from: "Le Trèfle 2.0 <noreply@solar.letrefle.org>",
            to: "contact@letrefle.org",
            replyTo: email,
            subject: emailSubject(`Contact : ${subject} (${name})`),
            html,
        });

        if (error) {
            console.error("Resend error:", error);
            // Technical details stay in the server logs (#275)
            return {error: "Le message n'a pas pu être envoyé. Réessayez plus tard."};
        }

        return {success: true};
    } catch (error) {
        console.error("Failed to send contact email:", error);
        return {error: "Une erreur est survenue lors de l'envoi du message."};
    }
}
