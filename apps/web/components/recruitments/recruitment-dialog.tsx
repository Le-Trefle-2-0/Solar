"use client";

import {useEffect, useState} from "react";
import {Recruitment} from "@prisma/client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {createRecruitment, updateRecruitment} from "@/app/actions/recruitments";
import {toast} from "sonner";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import {FieldManager, RecruitmentField} from "./field-manager";
import {Checkbox} from "@/components/ui/checkbox";

const DEFAULT_FIELDS: RecruitmentField[] = [
    {name: "firstName", label: "Prénom", type: "text", required: true},
    {name: "lastName", label: "Nom", type: "text", required: true},
    {name: "email", label: "Email", type: "email", required: true},
    {name: "message", label: "Message", type: "textarea", required: true},
];

const recruitmentSchema = z.object({
    title: z.string().min(1, "Le titre est obligatoire"),
    description: z.string().min(1, "La description est obligatoire"),
    icon: z.string().optional().nullable(),
    contactEmail: z.string().email("Email de contact invalide").optional().nullable().or(z.literal("")),
    enabled: z.boolean().default(true),
});

type RecruitmentFormValues = z.infer<typeof recruitmentSchema>;

interface RecruitmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    recruitment: Recruitment | null;
    onSave: (recruitment: Recruitment) => void;
}

export function RecruitmentDialog({open, onOpenChange, recruitment, onSave}: RecruitmentDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fields, setFields] = useState<RecruitmentField[]>(DEFAULT_FIELDS);

    const form = useForm<RecruitmentFormValues>({
        resolver: zodResolver(recruitmentSchema),
        defaultValues: {
            title: "",
            description: "",
            icon: "Users",
            contactEmail: "",
            enabled: true,
        },
    });

    useEffect(() => {
        if (recruitment) {
            form.reset({
                title: recruitment.title,
                description: recruitment.description,
                icon: recruitment.icon,
                contactEmail: (recruitment as any).contactEmail || "",
                enabled: recruitment.enabled,
            });
            setFields(recruitment.fields as any || DEFAULT_FIELDS);
        } else {
            form.reset({
                title: "",
                description: "",
                icon: "Users",
                contactEmail: "",
                enabled: true,
            });
            setFields(DEFAULT_FIELDS);
        }
    }, [recruitment, form, open]);

    async function onSubmit(values: RecruitmentFormValues) {
        setIsSubmitting(true);
        try {
            const data = {
                ...values,
                fields,
            };

            let result;
            if (recruitment) {
                result = await updateRecruitment(recruitment.id, data);
                toast.success("Recrutement mis à jour");
            } else {
                result = await createRecruitment(data);
                toast.success("Recrutement publié");
            }

            onSave(result as any);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Une erreur est survenue");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90vw] sm:max-w-[90vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{recruitment ? "Modifier le recrutement" : "Publier un recrutement"}</DialogTitle>
                    <DialogDescription>
                        Configurez les détails du recrutement et les champs du formulaire de candidature.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Titre *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Bénévole Écoutant" {...field} />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="icon"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Icône (Nom Lucide)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Users, Heart, MessageSquare..." {...field}
                                                   value={field.value || ""}/>
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contactEmail"
                                render={({field}) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Email de réception des candidatures</FormLabel>
                                        <FormControl>
                                            <Input placeholder="contact@letrefle.org" type="email" {...field}
                                                   value={field.value || ""}/>
                                        </FormControl>
                                        <DialogDescription>
                                            Les candidatures seront envoyées à cet email. Par défaut :
                                            contact@letrefle.org
                                        </DialogDescription>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="enabled"
                            render={({field}) => (
                                <FormItem
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-xs">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Activer le recrutement</FormLabel>
                                        <DialogDescription>
                                            Si désactivé, le recrutement ne sera plus visible et ne pourra plus recevoir
                                            de candidatures.
                                        </DialogDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <FormLabel>Description (Markdown) *</FormLabel>
                            <Tabs defaultValue="edit" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="edit">Modifier</TabsTrigger>
                                    <TabsTrigger value="preview">Aperçu</TabsTrigger>
                                </TabsList>
                                <TabsContent value="edit" className="mt-2">
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Décrivez le rôle, les missions, les prérequis..."
                                                        className="min-h-[200px] font-mono"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </TabsContent>
                                <TabsContent value="preview"
                                             className="mt-2 min-h-[200px] p-4 border rounded-md bg-muted/50 prose dark:prose-invert max-w-none">
                                    <ReactMarkdown>{form.watch("description") || "*Aucune description*"}</ReactMarkdown>
                                </TabsContent>
                            </Tabs>
                        </div>

                        <FieldManager fields={fields} onChange={setFields}/>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Enregistrement..." : recruitment ? "Mettre à jour" : "Publier"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
