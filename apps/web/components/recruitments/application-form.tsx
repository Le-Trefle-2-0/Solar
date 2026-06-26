"use client";

import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";
import {applyToRecruitment} from "@/app/actions/recruitments";
import {RecruitmentField} from "@/lib/recruitments";

interface ApplicationFormProps {
    recruitmentId: string;
    fields: RecruitmentField[];
    onSuccess?: () => void;
}

export function ApplicationForm({recruitmentId, fields, onSuccess}: ApplicationFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic Zod Schema
    const schemaShape: Record<string, any> = {};
    fields.forEach((field) => {
        let fieldSchema: z.ZodTypeAny = z.string();

        if (field.type === "email") {
            fieldSchema = (fieldSchema as z.ZodString).email("Email invalide");
        }

        // Apply max first while it's still a ZodString
        if (fieldSchema instanceof z.ZodString) {
            fieldSchema = fieldSchema.max(10000, "Maximum 10 000 caractères");
        }

        if (field.min) {
            if (field.minUnit === "words") {
                fieldSchema = fieldSchema.refine(
                    (val) => val.trim().split(/\s+/).filter(Boolean).length >= (field.min || 0),
                    {message: `Minimum ${field.min} mots`}
                );
            } else {
                if (fieldSchema instanceof z.ZodString) {
                    fieldSchema = fieldSchema.min(field.min, `Minimum ${field.min} caractères`);
                }
            }
        }

        if (field.required) {
            if (fieldSchema instanceof z.ZodString) {
                fieldSchema = fieldSchema.min(1, `${field.label} est obligatoire`);
            }
        } else {
            fieldSchema = fieldSchema.optional();
        }

        schemaShape[field.name] = fieldSchema;
    });

    const applicationSchema = z.object(schemaShape);
    type ApplicationValues = z.infer<typeof applicationSchema>;

    const defaultValues: Record<string, string> = {};
    fields.forEach(field => {
        defaultValues[field.name] = "";
    });

    const form = useForm<ApplicationValues>({
        resolver: zodResolver(applicationSchema),
        defaultValues,
    });

    async function onSubmit(values: ApplicationValues) {
        setIsSubmitting(true);
        try {
            const result = await applyToRecruitment(recruitmentId, values);
            if (result.success) {
                toast.success("Votre candidature a été envoyée avec succès !");
                form.reset();
                onSuccess?.();
            } else {
                toast.error(result.error || "Une erreur est survenue.");
            }
        } catch (error) {
            toast.error("Une erreur est survenue lors de l'envoi.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    {fields.map((field) => (
                        <FormField
                            key={field.name}
                            control={form.control}
                            name={field.name as any}
                            render={({field: formField}) => (
                                <FormItem className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                                    <FormLabel>{field.label} {field.required && "*"}</FormLabel>
                                    <FormControl>
                                        {field.type === "textarea" ? (
                                            <Textarea
                                                placeholder={field.label}
                                                className="min-h-[120px]"
                                                {...formField}
                                            />
                                        ) : (
                                            <Input
                                                type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
                                                placeholder={field.label}
                                                {...formField}
                                            />
                                        )}
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    ))}
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Envoi en cours..." : "Envoyer ma candidature"}
                </Button>
            </form>
        </Form>
    );
}
