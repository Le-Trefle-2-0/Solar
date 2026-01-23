"use client";
import React, {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z
    .object({
        currentPassword: z.string().min(1, "Mot de passe actuel requis"),
        newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
        confirmPassword: z.string().min(1, "Confirmez le nouveau mot de passe"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Les nouveaux mots de passe ne correspondent pas",
        path: ["confirmPassword"],
    });

type FormData = z.infer<typeof schema>;

export default function ChangePasswordCustom() {
    const {register, handleSubmit, formState: {errors, isSubmitting}, reset} = useForm<FormData>({resolver: zodResolver(schema)});
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (data: FormData) => {
        setMessage(null);
        setError(null);
        try {
            const res = await fetch('/api/change-password', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({currentPassword: data.currentPassword, newPassword: data.newPassword}),
                credentials: 'same-origin',
            });
            const json = await res.json();
            if (!res.ok || json.error) {
                setError(json.error || 'Erreur lors du changement de mot de passe');
                return;
            }
            setMessage('Mot de passe changé avec succès');
            reset();
        } catch (e: any) {
            setError(e?.message || 'Erreur réseau');
        }
    };

    return (
        <div className="bg-card text-card-foreground p-6 rounded-xl border-2 border-main">
            <h3 className="font-semibold mb-2">Changer le mot de passe</h3>
            <p className="text-sm text-muted-foreground mb-4">Entrez votre mot de passe actuel puis choisissez un nouveau mot de passe.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-3">
                <div>
                    <label className="text-sm">Mot de passe actuel</label>
                    <input type="password" {...register('currentPassword')} className="mt-1 w-full rounded-md border px-3 py-2" />
                    {errors.currentPassword && <div className="text-xs text-destructive">{errors.currentPassword.message}</div>}
                </div>

                <div>
                    <label className="text-sm">Nouveau mot de passe</label>
                    <input type="password" {...register('newPassword')} className="mt-1 w-full rounded-md border px-3 py-2" />
                    {errors.newPassword && <div className="text-xs text-destructive">{errors.newPassword.message}</div>}
                </div>

                <div>
                    <label className="text-sm">Confirmer le nouveau mot de passe</label>
                    <input type="password" {...register('confirmPassword')} className="mt-1 w-full rounded-md border px-3 py-2" />
                    {errors.confirmPassword && <div className="text-xs text-destructive">{errors.confirmPassword.message}</div>}
                </div>

                <div className="flex items-center gap-3 mt-2">
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary px-4 py-2 rounded-md">
                        {isSubmitting ? 'En cours...' : 'Enregistrer'}
                    </button>
                    {message && <div className="text-sm text-green-600">{message}</div>}
                    {error && <div className="text-sm text-destructive">{error}</div>}
                </div>
            </form>
        </div>
    );
}
