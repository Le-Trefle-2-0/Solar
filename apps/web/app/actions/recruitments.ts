"use server";

import prisma from "@/lib/prisma";
import {z} from "zod";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {revalidatePath} from "next/cache";

const fieldSchema = z.object({
    name: z.string().min(1),
    label: z.string().min(1),
    type: z.string(), // "text" | "email" | "textarea" | "number"
    required: z.boolean(),
});

const recruitmentSchema = z.object({
    title: z.string().min(1, "Le titre est obligatoire"),
    description: z.string().min(1, "La description est obligatoire"),
    icon: z.string().optional().nullable(),
    contactEmail: z.string().email("Email de contact invalide").optional().nullable().or(z.literal("")),
    fields: z.array(fieldSchema),
    enabled: z.boolean().default(true),
});

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

    const fieldsHtml = Object.entries(data)
        .map(([key, value]) => {
            const field = (recruitment.fields as any[]).find(f => f.name === key);
            const label = field ? field.label : key;
            return `<p><strong>${label} :</strong> ${String(value).replace(/\n/g, "<br>")}</p>`;
        })
        .join("");

    try {
        const {error} = await resend.emails.send({
            from: "noreply@solar.letrefle.org",
            to: recruitment.contactEmail || "contact@letrefle.org",
            replyTo: applicantEmail,
            subject: `[Recrutement] ${recruitment.title} - ${applicantName}`,
            html: `
                <h2>Nouvelle candidature pour : ${recruitment.title}</h2>
                <hr />
                ${fieldsHtml}
                <hr />
                <p>Candidature envoyée le ${new Date().toLocaleString()}</p>
            `,
        });

        if (error) {
            console.error("Resend error:", error);
            return {error: `Erreur Resend: ${error.message}`};
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

    if (!session || (session.user as any).role !== "admin") {
        throw new Error("Non autorisé");
    }

    const validated = recruitmentSchema.parse(data);

    const recruitment = await prisma.recruitment.create({
        data: {
            title: validated.title,
            description: validated.description,
            icon: validated.icon,
            contactEmail: validated.contactEmail,
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

    if (!session || (session.user as any).role !== "admin") {
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

    if (!session || (session.user as any).role !== "admin") {
        throw new Error("Non autorisé");
    }

    await prisma.recruitment.delete({
        where: {id},
    });

    revalidatePath("/app/recruitments");
    return {success: true};
}
