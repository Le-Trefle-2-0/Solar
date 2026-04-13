"use client";

import {useEffect, useState} from "react";
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
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";
import {submitDocumentsAction} from "@/app/actions/users";
import {authClient} from "@/lib/auth-client";
import {CalendarIcon, Check, Upload} from "lucide-react";
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {cn} from "@/lib/utils";
import {format} from "date-fns";
import {fr} from "date-fns/locale";

const docSchema = z.object({
    firstName: z.string().min(1, "Prénom requis").optional().or(z.literal("")),
    lastName: z.string().min(1, "Nom requis").optional().or(z.literal("")),
    birthDate: z.string().min(1, "Date de naissance requise").optional().or(z.literal("")),
    addressStreet: z.string().min(1, "Rue requise").optional().or(z.literal("")),
    addressNumber: z.string().min(1, "Numéro requis").optional().or(z.literal("")),
    addressPostalCode: z.string().min(1, "Code postal requis").optional().or(z.literal("")),
    addressCity: z.string().min(1, "Ville requise").optional().or(z.literal("")),
    idCard: z.any().optional(),
    casier: z.any().optional(),
});

export function DocumentSubmissionDialog({
                                             open,
                                             onOpenChange,
                                             isRenewal = false,
                                             deadline,
                                             isDismissible = false,
                                         }: {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    isRenewal?: boolean;
    deadline?: string;
    isDismissible?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(open);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [idCardFile, setIdCardFile] = useState<File | null>(null);
    const [casierFile, setCasierFile] = useState<File | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        setIsOpen(open);
    }, [open]);

    const form = useForm<z.infer<typeof docSchema>>({
        resolver: zodResolver(docSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            birthDate: "",
            addressStreet: "",
            addressNumber: "",
            addressPostalCode: "",
            addressCity: "",
        },
    });

    useEffect(() => {
        // Pre-fill with session data if available
        const fetchUserData = async () => {
            const {data: session} = await authClient.getSession();
            if (session?.user) {
                const userData = session.user as any;
                setUser(userData);
                form.reset({
                    firstName: userData.firstName || "",
                    lastName: userData.lastName || "",
                    birthDate: userData.birthDate ? new Date(userData.birthDate).toISOString().split('T')[0] : "",
                    addressStreet: userData.addressStreet || "",
                    addressNumber: userData.addressNumber || "",
                    addressPostalCode: userData.addressPostalCode || "",
                    addressCity: userData.addressCity || "",
                });
            }
        };
        fetchUserData();
    }, [form]);

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:7001'}/v1/files`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error("Failed to upload file");
        const data = await res.json();
        return data.id;
    };

    const truncateFileName = (name: string, maxLength = 24) => {
        if (name.length <= maxLength) return name;
        const extension = name.split('.').pop();
        const nameWithoutExtension = name.substring(0, name.lastIndexOf('.'));
        const charsToShow = maxLength - (extension?.length || 0) - 5;
        if (charsToShow <= 0) return name.substring(0, maxLength - 3) + '...';
        const front = nameWithoutExtension.substring(0, Math.ceil(charsToShow / 2) + 2);
        const back = nameWithoutExtension.substring(nameWithoutExtension.length - Math.floor(charsToShow / 2));
        return `${front}...${back}.${extension}`;
    };

    async function onSubmit(values: z.infer<typeof docSchema>) {
        setIsSubmitting(true);
        try {
            let idCardFileId = undefined;
            let casierFileId = undefined;

            if (idCardFile) {
                idCardFileId = await uploadFile(idCardFile);
            }
            if (casierFile) {
                casierFileId = await uploadFile(casierFile);
            }

            const result = await submitDocumentsAction({
                ...values,
                idCardFileId,
                casierFileId,
            });

            if (result.success) {
                toast.success("Documents envoyés avec succès !");
                form.reset();
                onOpenChange?.(false);
                window.location.reload();
            } else {
                toast.error(result.error || "Une erreur est survenue.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Une erreur est survenue lors de l'envoi.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(val) => {
            // Prevent closing if it's not dismissible
            if (!isDismissible && !val) return;
            setIsOpen(val);
            onOpenChange?.(val);
        }}>
            <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => {
                if (!isDismissible) e.preventDefault();
            }} onEscapeKeyDown={(e) => {
                if (!isDismissible) e.preventDefault();
            }}>
                <DialogHeader>
                    <DialogTitle>{isRenewal ? "Renouvellement administratif" : "Validation administrative"}</DialogTitle>
                    <DialogDescription>
                        {user?.documentsStatus === 'rejected'
                            ? "Certains de vos documents ont été refusés. Veuillez les soumettre à nouveau."
                            : isRenewal
                                ? `Il est temps de renouveler vos documents administratifs annuels. Vous avez jusqu'au ${deadline} pour le faire avant que votre accès ne soit restreint.`
                                : "Pour accéder à la plateforme, vous devez soumettre vos informations administratives."}
                    </DialogDescription>
                    {user?.idCardStatus === 'rejected' && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                            <strong>Pièce d'identité refusée :</strong> {user.idCardRejectReason}
                        </div>
                    )}
                    {user?.casierStatus === 'rejected' && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 mt-2">
                            <strong>Casier judiciaire refusé :</strong> {user.casierRejectReason}
                        </div>
                    )}
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {(!user?.firstName || user?.documentsStatus !== 'rejected') && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="firstName"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Prénom</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Prénom" {...field} />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lastName"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Nom</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nom" {...field} />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="birthDate"
                                    render={({field}) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Date de naissance</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(new Date(field.value), "PPP", {locale: fr})
                                                            ) : (
                                                                <span>Choisir une date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50"/>
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value ? new Date(field.value) : undefined}
                                                        onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                                                        disabled={(date) =>
                                                            date > new Date() || date < new Date("1900-01-01")
                                                        }
                                                        captionLayout="dropdown"
                                                        fromYear={1900}
                                                        toYear={new Date().getFullYear()}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-4 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="addressNumber"
                                        render={({field}) => (
                                            <FormItem className="col-span-1">
                                                <FormLabel>N°</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="12" {...field} />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="addressStreet"
                                        render={({field}) => (
                                            <FormItem className="col-span-3">
                                                <FormLabel>Rue</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Rue de la Paix" {...field} />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="addressPostalCode"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Code Postal</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="75001" {...field} />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="addressCity"
                                        render={({field}) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Ville</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Paris" {...field} />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-4 pt-4 border-t">
                            {(user?.idCardStatus !== 'validated') ? (
                                <div className="space-y-2">
                                    <FormLabel>Pièce d'identité (Recto/Verso)</FormLabel>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => document.getElementById('idCardInput')?.click()}
                                        >
                                            <Upload className="mr-2 h-4 w-4 shrink-0"/>
                                            <span className="truncate">
                                                {idCardFile ? truncateFileName(idCardFile.name) : "Choisir un fichier"}
                                            </span>
                                        </Button>
                                        <input
                                            id="idCardInput"
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,image/png,image/jpeg,image/jpg"
                                            onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="flex items-center justify-between p-2 bg-green-50 border border-green-100 rounded text-xs text-green-700">
                                    <span>Pièce d'identité validée</span>
                                    <Check className="h-4 w-4"/>
                                </div>
                            )}

                            {(user?.casierStatus !== 'validated') ? (
                                <div className="space-y-2">
                                    <FormLabel>Casier judiciaire (Bulletin n°3)</FormLabel>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => document.getElementById('casierInput')?.click()}
                                        >
                                            <Upload className="mr-2 h-4 w-4 shrink-0"/>
                                            <span className="truncate">
                                                {casierFile ? truncateFileName(casierFile.name) : "Choisir un fichier"}
                                            </span>
                                        </Button>
                                        <input
                                            id="casierInput"
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,image/png,image/jpeg,image/jpg"
                                            onChange={(e) => setCasierFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="flex items-center justify-between p-2 bg-green-50 border border-green-100 rounded text-xs text-green-700">
                                    <span>Casier judiciaire validé</span>
                                    <Check className="h-4 w-4"/>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-2">
                            {isDismissible && (
                                <Button type="button" variant="outline" onClick={() => {
                                    setIsOpen(false);
                                    onOpenChange?.(false);
                                }} className="w-full sm:w-auto">
                                    Plus tard
                                </Button>
                            )}
                            <Button type="submit" disabled={isSubmitting} className="flex-1">
                                {isSubmitting ? "Envoi en cours..." : "Envoyer mon dossier"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
