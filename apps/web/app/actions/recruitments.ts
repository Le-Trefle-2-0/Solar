"use server";

import prisma from "@/lib/prisma";
import {can, getAccess} from "@/lib/userPermissions";
import {z} from "zod";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {revalidatePath} from "next/cache";

import {recruitmentSchema} from "@/lib/recruitments";
import {renderEmailTemplate} from "@/lib/email-template";
import {allowPublicAction, TOO_MANY_REQUESTS} from "@/lib/security/actionRateLimit";
import {emailSubject, escapeDiscord, escapeHtml} from "@/lib/security/escape";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function summarizeDescription(title: string, description: string) {
    if (!process.env.GROQ_API_KEY) {
        console.warn("GROQ_API_KEY is not set. Skipping AI summarization.");
        return null;
    }

    try {
        const SYSTEM_PROMPT = `Tu es un assistant chargé de résumer des offres de recrutement pour des bénévoles. 
Ta tâche est de fournir un résumé court (maximum 2 phrases, environ 30-40 mots) qui donne envie de postuler et explique l'essentiel de la mission.
Réponds UNIQUEMENT avec un objet JSON au format: {"summary": "ton résumé ici"}.`;

        const model = 'qwen/qwen3.6-27b';

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {role: 'system', content: SYSTEM_PROMPT},
                    {
                        role: 'user',
                        content: `Titre du poste: ${title}\nDescription:\n${description}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 300,
                response_format: {type: "json_object"}
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`Groq API error (${response.status}):`, error);
            return null;
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content;
        if (!content) return null;

        // Remove thinking process if present
        content = content.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').trim();

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            content = jsonMatch[0];
        }

        const parsed = JSON.parse(content);
        return parsed.summary || null;
    } catch (error) {
        console.error("AI Summarization failed:", error);
        return null;
    }
}

/** At most this many characters per answer, and of Discord messages per application. */
const MAX_ANSWER_LENGTH = 10_000;
const MAX_DISCORD_MESSAGES = 6;

/**
 * Posts an application to the recruitment's Discord webhook: answers shown as typed (no
 * formatting, link or mention), split over a bounded number of messages (#265).
 */
async function sendApplicationToDiscord(webhook: string, title: string, answers: { label: string; value: string }[]) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://solar.letrefle.org";
    const fields: { name: string; value: string; inline: boolean }[] = [];
    for (const {label, value} of answers) {
        const text = escapeDiscord(value || "Non renseigné");
        const name = escapeDiscord(label).slice(0, 200);
        // Discord: 1024 characters per field value
        for (let i = 0, part = 1; i < text.length; i += 1000, part++) {
            fields.push({name: part === 1 ? name : `${name} (suite ${part})`, value: text.slice(i, i + 1000), inline: false});
        }
    }

    const messages: typeof fields[] = [];
    let current: typeof fields = [];
    let length = 0;
    for (const field of fields) {
        const size = field.name.length + field.value.length;
        if (current.length >= 15 || length + size > 5000) {
            messages.push(current);
            current = [];
            length = 0;
        }
        current.push(field);
        length += size;
    }
    if (current.length) messages.push(current);

    const safeTitle = escapeDiscord(title).slice(0, 200);
    for (const [index, chunk] of messages.slice(0, MAX_DISCORD_MESSAGES).entries()) {
        const first = index === 0;
        const response = await fetch(webhook, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                username: "Recrutement - Le Trèfle",
                avatar_url: `${appUrl}/Logomark1024_marges.png`,
                // Never ping anyone, whatever the text says
                allowed_mentions: {parse: []},
                embeds: [{
                    title: first ? `Nouvelle candidature : ${safeTitle}` : `Suite candidature : ${safeTitle}`,
                    color: 0x5865F2,
                    fields: chunk,
                    footer: first ? {text: `Candidature envoyée le ${new Date().toLocaleString("fr-FR")}`} : undefined,
                    timestamp: first ? new Date().toISOString() : undefined,
                }],
            }),
        });
        if (!response.ok) console.error(`Discord webhook error (${response.status}):`, await response.text());
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (messages.length > MAX_DISCORD_MESSAGES) {
        console.warn(`[recruitments] application cut on Discord after ${MAX_DISCORD_MESSAGES} messages; the e-mail has it all`);
    }
}

export async function applyToRecruitment(recruitmentId: string, data: Record<string, any>) {
    if (!await allowPublicAction("application")) return {error: TOO_MANY_REQUESTS};
    const recruitment = await prisma.recruitment.findUnique({
        where: {id: recruitmentId},
    });

    if (!recruitment || !recruitment.enabled) {
        return {error: "Ce recrutement n'est plus disponible."};
    }

    const {getResendClient} = await import("@/lib/resend");
    const resend = getResendClient();

    // Only the fields of this recruitment, each bounded: never keys chosen by the sender (#265)
    const recruitmentFields = (recruitment.fields as any[]).filter(f => f && typeof f.name === "string");
    const answers: { label: string; value: string }[] = [];
    for (const field of recruitmentFields) {
        const raw = data?.[field.name];
        const value = (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean" ? String(raw) : "").trim();

        if (field.required && !value) {
            return {error: `Le champ "${field.label}" est obligatoire.`};
        }

        if (value) {
            if (field.min) {
                if (field.minUnit === "words") {
                    const wordCount = value.split(/\s+/).filter(Boolean).length;
                    if (wordCount < field.min) {
                        return {error: `Le champ "${field.label}" doit contenir au moins ${field.min} mots.`};
                    }
                } else {
                    if (value.length < field.min) {
                        return {error: `Le champ "${field.label}" doit contenir au moins ${field.min} caractères.`};
                    }
                }
            }

            if (value.length > MAX_ANSWER_LENGTH) {
                return {error: `Le champ "${field.label}" ne doit pas dépasser 10 000 caractères.`};
            }
        }
        answers.push({label: String(field.label ?? field.name).slice(0, 200), value});
    }

    const answer = (name: string) => {
        const raw = data?.[name];
        return typeof raw === "string" ? raw.trim().slice(0, 200) : "";
    };
    const email = answer("email");
    const applicantEmail = z.string().email().safeParse(email).success ? email : "noreply@solar.letrefle.org";
    const applicantName = `${answer("firstName")} ${answer("lastName")}`.trim() || "Candidat";

    const fieldsHtml = answers
        .map(({label, value}) => `<p><strong>${escapeHtml(label)} :</strong> ${escapeHtml(value || "Non renseigné", {lineBreaks: true})}</p>`)
        .join("");

    const {html} = renderEmailTemplate({
        title: `Nouvelle candidature : ${escapeHtml(recruitment.title)}`,
        content: `
            <div style="margin-bottom: 20px;">
                ${fieldsHtml}
            </div>
        `,
        footer: `Candidature envoyée le ${new Date().toLocaleString("fr-FR")}`
    });

    try {
        const {error} = await resend.emails.send({
            from: "Le Trèfle 2.0 <noreply@solar.letrefle.org>",
            to: recruitment.contactEmail || "contact@letrefle.org",
            replyTo: applicantEmail,
            subject: emailSubject(`[Recrutement] ${recruitment.title} - ${applicantName}`),
            html,
        });

        if (error) {
            console.error("Resend error:", error);
            // Technical details stay in the server logs (#275)
            return {error: "Votre candidature n'a pas pu être envoyée. Réessayez plus tard."};
        }

        if (recruitment.discordWebhook) {
            try {
                await sendApplicationToDiscord(recruitment.discordWebhook, recruitment.title, answers);
            } catch (discordErr) {
                console.error("Failed to send to Discord webhook:", discordErr);
            }
        }

        return {success: true};
    } catch (err) {
        console.error("Failed to send application email:", err);
        return {error: "Une erreur est survenue lors de l'envoi de votre candidature."};
    }
}

export async function createRecruitment(data: z.infer<typeof recruitmentSchema>) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const access = await getAccess();
    const isAuthorized = !!access && can(access.permissions, "recruitments.manage");

    if (!session || !isAuthorized) {
        throw new Error("Non autorisé");
    }

    const validated = recruitmentSchema.parse(data);

    let shortDescription = validated.shortDescription;
    if (!shortDescription) {
        shortDescription = await summarizeDescription(validated.title, validated.description);
    }

    const recruitment = await prisma.recruitment.create({
        data: {
            title: validated.title,
            description: validated.description,
            shortDescription: shortDescription,
            icon: validated.icon,
            contactEmail: validated.contactEmail,
            discordWebhook: validated.discordWebhook,
            fields: validated.fields as any,
            enabled: validated.enabled,
        },
    });

    revalidatePath("/app/recruitments");
    return recruitment;
}

export async function updateRecruitment(id: string, data: z.infer<typeof recruitmentSchema>) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const access = await getAccess();
    const isAuthorized = !!access && can(access.permissions, "recruitments.manage");

    if (!session || !isAuthorized) {
        throw new Error("Non autorisé");
    }

    const validated = recruitmentSchema.parse(data);

    const oldRecruitment = await prisma.recruitment.findUnique({
        where: {id},
        select: {enabled: true, title: true, description: true, shortDescription: true},
    });

    if (!oldRecruitment) {
        throw new Error("Recrutement introuvable");
    }

    let shortDescription = validated.shortDescription;
    // Automatically generate shortDescription if:
    // 1. It is explicitly cleared (empty string)
    // 2. It is not provided AND the description has changed
    const descriptionChanged = validated.description !== oldRecruitment.description;
    const shouldSummarize =
        shortDescription === "" ||
        (!shortDescription && descriptionChanged);

    if (shouldSummarize) {
        shortDescription = await summarizeDescription(validated.title, validated.description);
    }

    const recruitment = await prisma.recruitment.update({
        where: {id},
        data: {
            title: validated.title,
            description: validated.description,
            shortDescription: shortDescription,
            icon: validated.icon,
            contactEmail: validated.contactEmail,
            discordWebhook: validated.discordWebhook,
            fields: validated.fields as any,
            enabled: validated.enabled,
        },
    });

    // If reopening, notify waitlist
    if (oldRecruitment && !oldRecruitment.enabled && validated.enabled) {
        const waitlist = await prisma.recruitmentWaitlist.findMany({
            where: {recruitmentId: id},
        });

        if (waitlist.length > 0) {
            const {getResendClient} = await import("@/lib/resend");
            const resend = getResendClient();

            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://solar.letrefle.org";
            const recruitmentUrl = `${baseUrl}/benevoles/${id}`;

            const {html} = renderEmailTemplate({
                title: `Recrutement réouvert : ${recruitment.title}`,
                content: `
                    <div style="margin-bottom: 20px;">
                        <p>Bonjour,</p>
                        <p>Le recrutement pour le poste "<strong>${recruitment.title}</strong>" vient d'être réouvert !</p>
                        <p>Vous aviez demandé à être prévenu de cette réouverture. Vous pouvez maintenant postuler en cliquant sur le bouton ci-dessous :</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${recruitmentUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Postuler maintenant</a>
                        </div>
                    </div>
                `,
                footer: `Vous recevez cet email car vous vous êtes inscrit sur la liste d'attente pour ce recrutement.`
            });

            // Send notifications (Resend handles batching/rate limiting better via multiple calls or their batch API)
            // For now, we'll send them individually as waitlists are usually small
            const notifiedEmails: string[] = [];
            for (const entry of waitlist) {
                try {
                    await resend.emails.send({
                        from: "Le Trèfle 2.0 <noreply@solar.letrefle.org>",
                        to: entry.email,
                        subject: `[Réouverture] ${recruitment.title} - Solar`,
                        html,
                    });
                    notifiedEmails.push(entry.email);
                } catch (err) {
                    console.error(`Failed to send waitlist notification to ${entry.email}:`, err);
                }
            }

            // Clear notified emails from waitlist
            if (notifiedEmails.length > 0) {
                await prisma.recruitmentWaitlist.deleteMany({
                    where: {
                        recruitmentId: id,
                        email: {in: notifiedEmails}
                    },
                });
            }
        }
    }

    revalidatePath("/app/recruitments");
    revalidatePath(`/benevoles/${id}`);
    return recruitment;
}

export async function deleteRecruitment(id: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const access = await getAccess();
    const isAuthorized = !!access && can(access.permissions, "recruitments.manage");

    if (!session || !isAuthorized) {
        throw new Error("Non autorisé");
    }

    await prisma.recruitment.delete({
        where: {id},
    });

    revalidatePath("/app/recruitments");
    return {success: true};
}

export async function toggleRecruitment(id: string, enabled: boolean) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const access = await getAccess();
    const isAuthorized = !!access && can(access.permissions, "recruitments.manage");

    if (!session || !isAuthorized) {
        throw new Error("Non autorisé");
    }

    const oldRecruitment = await prisma.recruitment.findUnique({
        where: {id},
        select: {enabled: true, title: true},
    });

    if (!oldRecruitment) {
        throw new Error("Recrutement introuvable");
    }

    const recruitment = await prisma.recruitment.update({
        where: {id},
        data: {enabled},
    });

    // If reopening, notify waitlist
    if (!oldRecruitment.enabled && enabled) {
        const waitlist = await prisma.recruitmentWaitlist.findMany({
            where: {recruitmentId: id},
        });

        if (waitlist.length > 0) {
            const {getResendClient} = await import("@/lib/resend");
            const resend = getResendClient();

            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://solar.letrefle.org";
            const recruitmentUrl = `${baseUrl}/benevoles/${id}`;

            const {html} = renderEmailTemplate({
                title: `Recrutement réouvert : ${recruitment.title}`,
                content: `
                    <div style="margin-bottom: 20px;">
                        <p>Bonjour,</p>
                        <p>Le recrutement pour le poste "<strong>${recruitment.title}</strong>" vient d'être réouvert !</p>
                        <p>Vous aviez demandé à être prévenu de cette réouverture. Vous pouvez maintenant postuler en cliquant sur le bouton ci-dessous :</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${recruitmentUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Postuler maintenant</a>
                        </div>
                    </div>
                `,
                footer: `Vous recevez cet email car vous vous êtes inscrit sur la liste d'attente pour ce recrutement.`
            });

            const notifiedEmails: string[] = [];
            for (const entry of waitlist) {
                try {
                    await resend.emails.send({
                        from: "Le Trèfle 2.0 <noreply@solar.letrefle.org>",
                        to: entry.email,
                        subject: `[Réouverture] ${recruitment.title} - Solar`,
                        html,
                    });
                    notifiedEmails.push(entry.email);
                } catch (err) {
                    console.error(`Failed to send waitlist notification to ${entry.email}:`, err);
                }
            }

            if (notifiedEmails.length > 0) {
                await prisma.recruitmentWaitlist.deleteMany({
                    where: {
                        recruitmentId: id,
                        email: {in: notifiedEmails}
                    },
                });
            }
        }
    }

    revalidatePath("/app/recruitments");
    revalidatePath(`/benevoles/${id}`);
    return recruitment;
}

export async function joinWaitlist(recruitmentId: string, email: string) {
    if (!await allowPublicAction("waitlist")) return {error: TOO_MANY_REQUESTS};
    const recruitment = await prisma.recruitment.findUnique({
        where: {id: recruitmentId},
    });

    if (!recruitment) {
        return {error: "Recrutement introuvable."};
    }

    if (recruitment.enabled) {
        return {error: "Ce recrutement est ouvert, vous pouvez postuler directement."};
    }

    const emailSchema = z.string().email("Email invalide");
    const validatedEmail = emailSchema.safeParse(email);

    if (!validatedEmail.success) {
        return {error: validatedEmail.error.issues[0].message};
    }

    try {
        await prisma.recruitmentWaitlist.upsert({
            where: {
                email_recruitmentId: {
                    email: validatedEmail.data,
                    recruitmentId,
                },
            },
            create: {
                email: validatedEmail.data,
                recruitmentId,
            },
            update: {},
        });

        return {success: true};
    } catch (err) {
        console.error("Failed to join waitlist:", err);
        return {error: "Une erreur est survenue lors de l'inscription à la liste d'attente."};
    }
}
