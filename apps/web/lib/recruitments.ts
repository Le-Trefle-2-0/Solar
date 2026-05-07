import {z} from "zod";

export const fieldSchema = z.object({
    name: z.string().min(1),
    label: z.string().min(1),
    type: z.string(), // "text" | "email" | "textarea" | "number"
    required: z.boolean(),
    min: z.number().optional().nullable(),
    minUnit: z.enum(["chars", "words"]).optional().default("chars"),
});

export const recruitmentSchema = z.object({
    title: z.string().min(1, "Le titre est obligatoire"),
    description: z.string().min(1, "La description est obligatoire"),
    icon: z.string().optional().nullable(),
    contactEmail: z.string().email("Email de contact invalide").optional().nullable().or(z.literal("")),
    discordWebhook: z.string().url("URL de webhook invalide").optional().nullable().or(z.literal("")),
    fields: z.array(fieldSchema),
    enabled: z.boolean(),
});

export type RecruitmentField = z.infer<typeof fieldSchema>;
export type RecruitmentValues = z.infer<typeof recruitmentSchema>;
