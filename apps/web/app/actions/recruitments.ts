"use server";

import prisma from "@/lib/prisma";
import {z} from "zod";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {revalidatePath} from "next/cache";

import {recruitmentSchema} from "@/lib/recruitments";
import {renderEmailTemplate} from "@/lib/email-template";

export async function getRecruitments() {
    return prisma.recruitment.findMany({
        orderBy: [
            {enabled: "desc"},
            {createdAt: "desc"}
        ],
    });
}

export async function getRecruitmentById(id: string) {
    return prisma.recruitment.findUnique({
        where: {id},
    });
}

export async function applyToRecruitment(recruitmentId: string, data: Record<string, any>) {
    const recruitment = await prisma.recruitment.findUnique({
        where: {id: recruitmentId},
    });

    if (!recruitment || !recruitment.enabled) {
        return {error: "Ce recrutement n'est plus disponible."};
    }

    const {getResendClient} = await import("@/lib/resend");
    const resend = getResendClient();

    // Use email from data if it exists for replyTo
    const applicantEmail = data.email || "noreply@solar.letrefle.org";
    const applicantName = `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Candidat";

    // Validation
    const recruitmentFields = recruitment.fields as any[];
    for (const field of recruitmentFields) {
        const value = String(data[field.name] || "").trim();

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

            if (value.length > 10000) {
                return {error: `Le champ "${field.label}" ne doit pas dépasser 10 000 caractères.`};
            }
        }
    }

    const fieldsHtml = Object.entries(data)
        .map(([key, value]) => {
            const field = (recruitment.fields as any[]).find(f => f.name === key);
            const label = field ? field.label : key;
            return `<p><strong>${label} :</strong> ${String(value).replace(/\n/g, "<br>")}</p>`;
        })
        .join("");

    const {html} = renderEmailTemplate({
        title: `Nouvelle candidature : ${recruitment.title}`,
        content: `
            <div style="margin-bottom: 20px;">
                ${fieldsHtml}
            </div>
        `,
        footer: `Candidature envoyée le ${new Date().toLocaleString()}`
    });

    try {
        const {error} = await resend.emails.send({
            from: "Le Trèfle 2.0 <noreply@solar.letrefle.org>",
            to: recruitment.contactEmail || "contact@letrefle.org",
            replyTo: applicantEmail,
            subject: `[Recrutement] ${recruitment.title} - ${applicantName}`,
            html,
        });

        if (error) {
            console.error("Resend error:", error);
            return {error: `Erreur Resend: ${error.message}`};
        }

        // Send to Discord if webhook is configured
        if (recruitment.discordWebhook) {
            try {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://solar.letrefle.org";
                const avatarUrl = `${appUrl}/Logomark1024_marges.png`;

                // Prepare all fields and handle splitting long values
                const discordFields: { name: string, value: string, inline: boolean }[] = [];

                Object.entries(data).forEach(([key, value]) => {
                    const field = (recruitment.fields as any[]).find(f => f.name === key);
                    const label = field ? field.label : key;
                    const stringValue = String(value) || "N/A";

                    if (stringValue.length <= 1024) {
                        discordFields.push({
                            name: label,
                            value: stringValue,
                            inline: false
                        });
                    } else {
                        // Split long value into multiple fields, avoid cutting in the middle of a word
                        let remaining = stringValue;
                        let part = 1;
                        while (remaining.length > 0) {
                            let chunk = "";
                            if (remaining.length <= 1024) {
                                chunk = remaining;
                                remaining = "";
                            } else {
                                // Try to find the last space or newline before 1024 characters
                                const possibleChunk = remaining.substring(0, 1024);
                                const lastSpace = Math.max(possibleChunk.lastIndexOf(" "), possibleChunk.lastIndexOf("\n"));

                                if (lastSpace > 0) {
                                    chunk = remaining.substring(0, lastSpace);
                                    remaining = remaining.substring(lastSpace).trim();
                                } else {
                                    // No space found, fallback to hard cut
                                    chunk = remaining.substring(0, 1024);
                                    remaining = remaining.substring(1024);
                                }
                            }

                            discordFields.push({
                                name: part === 1 ? label : `${label} (Suite ${part})`,
                                value: chunk,
                                inline: false
                            });
                            part++;
                        }
                    }
                });

                // Split fields into chunks. Discord limits: 25 fields per embed, 6000 total characters per embed.
                // We'll use a more conservative approach: max 10 fields OR ~5000 characters per embed.
                let currentFields: typeof discordFields = [];
                let currentLength = 0;
                let isFirstMessage = true;

                const sendCurrentChunk = async () => {
                    if (currentFields.length === 0) return;

                    const response = await fetch(recruitment.discordWebhook!, {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({
                            username: "Recrutement - Le Trèfle",
                            avatar_url: avatarUrl,
                            embeds: [{
                                title: isFirstMessage ? `Nouvelle candidature : ${recruitment.title}` : `Suite candidature : ${recruitment.title}`,
                                color: 0x5865F2,
                                fields: currentFields,
                                footer: isFirstMessage ? {
                                    text: `Candidature envoyée le ${new Date().toLocaleString()}`
                                } : undefined,
                                timestamp: isFirstMessage ? new Date().toISOString() : undefined
                            }]
                        })
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`Discord webhook error (${response.status}):`, errorText);
                    }

                    currentFields = [];
                    currentLength = 0;
                    isFirstMessage = false;

                    // Small delay to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 500));
                };

                for (const field of discordFields) {
                    const fieldLength = field.name.length + field.value.length;

                    // If adding this field exceeds limits, send current chunk first
                    if (currentFields.length >= 15 || (currentLength + fieldLength) > 5000) {
                        await sendCurrentChunk();
                    }

                    currentFields.push(field);
                    currentLength += fieldLength;
                }

                // Send the last chunk
                await sendCurrentChunk();

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

    const userRole = (session?.user as any)?.role || "";
    const isAuthorized = userRole.split(",").some((r: string) => r === "admin" || r === "manager");

    if (!session || !isAuthorized) {
        throw new Error("Non autorisé");
    }

    const validated = recruitmentSchema.parse(data);

    const recruitment = await prisma.recruitment.create({
        data: {
            title: validated.title,
            description: validated.description,
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

    const userRole = (session?.user as any)?.role || "";
    const isAuthorized = userRole.split(",").some((r: string) => r === "admin" || r === "manager");

    if (!session || !isAuthorized) {
        throw new Error("Non autorisé");
    }

    const validated = recruitmentSchema.parse(data);

    const recruitment = await prisma.recruitment.update({
        where: {id},
        data: {
            title: validated.title,
            description: validated.description,
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

export async function deleteRecruitment(id: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const userRole = (session?.user as any)?.role || "";
    const isAuthorized = userRole.split(",").some((r: string) => r === "admin" || r === "manager");

    if (!session || !isAuthorized) {
        throw new Error("Non autorisé");
    }

    await prisma.recruitment.delete({
        where: {id},
    });

    revalidatePath("/app/recruitments");
    return {success: true};
}
