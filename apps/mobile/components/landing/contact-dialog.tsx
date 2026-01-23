"use client";

import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {toast} from "sonner";
import {apiFetch} from "@/lib/api";

const contactSchema = z.object({
    name: z.string().min(1, "Le nom est obligatoire"),
    email: z.string().email("Email invalide"),
    phonePrefix: z.string().optional(),
    phoneNumber: z.string().optional(),
    subject: z.string().min(1, "L'objet est obligatoire"),
    text: z.string().min(1, "Le message est obligatoire"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const countryCodes = [
    {label: "FR +33", value: "+33"},
    {label: "BE +32", value: "+32"},
    {label: "CH +41", value: "+41"},
    {label: "LU +352", value: "+352"},
    {label: "CA +1", value: "+1"},
];

export function ContactDialog({
                                  open,
                                  onOpenChange,
                              }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: "",
            email: "",
            phonePrefix: "+33",
            phoneNumber: "",
            subject: "",
            text: "",
        },
    });

    async function onSubmit(values: ContactFormValues) {
        setIsSubmitting(true);
        try {
            await apiFetch('/v1/contact', {
                method: 'POST',
                body: JSON.stringify(values)
            });
            toast.success("Message envoyé avec succès !");
            form.reset();
            onOpenChange(false);
        } catch (error) {
            toast.error("Une erreur est survenue lors de l'envoi.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Contactez-nous</DialogTitle>
                    <DialogDescription>
                        Remplissez ce formulaire pour nous envoyer un message. Nous vous répondrons dès que possible.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Nom *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Votre nom" {...field} />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Email *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="votre@email.com" type="email" {...field} />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex gap-4">
                            <FormField
                                control={form.control}
                                name="phonePrefix"
                                render={({field}) => (
                                    <FormItem className="w-32">
                                        <FormLabel>Pays</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Code"/>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {countryCodes.map((code) => (
                                                    <SelectItem key={code.value} value={code.value}>
                                                        {code.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({field}) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Téléphone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="06 12 34 56 78" {...field} />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="subject"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Objet *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Sujet de votre message" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="text"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Message *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Comment pouvons-nous vous aider ?"
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                                {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
