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
import {apiFetch} from "@/lib/api";
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
        let fieldSchema = z.string();

        if (field.required) {
            fieldSchema = fieldSchema.min(1, `${field.label} est obligatoire`);
        } else {
            fieldSchema = fieldSchema.optional() as any;
        }

        if (field.type === "email") {
            fieldSchema = fieldSchema.email("Email invalide") as any;
        } else if (field.type === "number") {
            // Numbers are often sent as strings in forms
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
            await apiFetch(`/v1/recruitments/${recruitmentId}/apply`, {
                method: 'POST',
                body: JSON.stringify(values)
            });
            toast.success("Votre candidature a été envoyée avec succès !");
            form.reset();
            onSuccess?.();
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
