"use client";

import {useEffect, useState} from "react";
import {Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label} from "@/components/ui";
import {Loader2} from "lucide-react";
import {toast} from "sonner";
import {apiFetch} from "@/lib/api";

type Field = "openingChannelId" | "openingMessageId" | "announceChannelId" | "voiceChannelId" | "helpChannelId";
type Values = Record<Field, string | null>;

const DISCORD_ID_RE = /^\d{15,22}$/;

const FIELDS: { key: Field; label: string; help: string }[] = [
    {
        key: "openingChannelId",
        label: "Salon d'ouverture des écoutes",
        help: "Le salon où se trouve le message avec le bouton « Ouvrir une écoute ».",
    },
    {
        key: "openingMessageId",
        label: "Message d'ouverture",
        help: "Le message du bot, dans ce salon, qui est modifié à l'ouverture et à la fermeture de la permanence. Vide : le bot reprend son dernier message du salon, ou en publie un.",
    },
    {
        key: "announceChannelId",
        label: "Salon d'annonce",
        help: "Le bot y annonce l'ouverture de la permanence. Vide : pas d'annonce.",
    },
    {
        key: "voiceChannelId",
        label: "Salon vocal",
        help: "Visible par tout le monde uniquement pendant les permanences. Vide : aucun salon vocal n'est géré.",
    },
    {
        key: "helpChannelId",
        label: "Salon « autres supports d'écoute »",
        help: "Mentionné dans les messages du bot quand la permanence est fermée.",
    },
];

const empty = (): Values => ({
    openingChannelId: null, openingMessageId: null, announceChannelId: null, voiceChannelId: null, helpChannelId: null,
});

/** Channels and opening message of the Discord bot; it applies changes right away. */
export function DiscordBotSettings() {
    const [values, setValues] = useState<Record<Field, string>>({
        openingChannelId: "", openingMessageId: "", announceChannelId: "", voiceChannelId: "", helpChannelId: "",
    });
    const [saved, setSaved] = useState<Values>(empty());
    const [fallback, setFallback] = useState<Values>(empty());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const show = (data: { settings: Values; fallback: Values }) => {
        setSaved(data.settings);
        setFallback(data.fallback);
        setValues(Object.fromEntries(FIELDS.map(f => [f.key, data.settings[f.key] ?? ""])) as Record<Field, string>);
    };

    useEffect(() => {
        apiFetch("/v1/bot/discord-settings")
            .then(show)
            .catch(() => toast.error("Impossible de charger les réglages du bot Discord"))
            .finally(() => setLoading(false));
    }, []);

    const invalid = FIELDS.filter(f => values[f.key].trim() && !DISCORD_ID_RE.test(values[f.key].trim()));
    const dirty = FIELDS.some(f => values[f.key].trim() !== (saved[f.key] ?? ""));

    const save = async () => {
        if (invalid.length) return;
        setSaving(true);
        try {
            const body = Object.fromEntries(FIELDS.map(f => [f.key, values[f.key].trim() || null]));
            show(await apiFetch("/v1/bot/discord-settings", {method: "PUT", body: JSON.stringify(body)}));
            toast.success("Réglages du bot enregistrés, il les applique tout de suite");
        } catch (error) {
            console.error(error);
            toast.error("Les réglages du bot n'ont pas été enregistrés");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bot Discord</CardTitle>
                <CardDescription>
                    Les salons et le message utilisés par le bot sur le serveur. Pour copier un identifiant,
                    activez le mode développeur de Discord (Paramètres &gt; Avancés), puis clic droit sur le salon
                    ou le message &gt; « Copier l'identifiant ».
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                {loading ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-5 md:grid-cols-2">
                            {FIELDS.map(f => {
                                const isInvalid = invalid.includes(f);
                                const envValue = fallback[f.key];
                                return (
                                    <div key={f.key} className="space-y-1.5">
                                        <Label htmlFor={`discord-${f.key}`}>{f.label}</Label>
                                        <Input
                                            id={`discord-${f.key}`}
                                            inputMode="numeric"
                                            value={values[f.key]}
                                            placeholder={envValue ? `${envValue} (fichier .env)` : "Identifiant Discord"}
                                            onChange={(e) => setValues({...values, [f.key]: e.target.value})}
                                            aria-invalid={isInvalid}
                                            aria-describedby={`discord-${f.key}-help`}
                                            disabled={saving}
                                        />
                                        <p id={`discord-${f.key}-help`}
                                           className={isInvalid ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                                            {isInvalid ? "Un identifiant Discord ne contient que des chiffres (17 à 20)." : f.help}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Un champ vide reprend la valeur du fichier .env du serveur, affichée en grisé quand il y en a une.
                        </p>
                        <div className="flex justify-end">
                            <Button onClick={save} disabled={saving || !dirty || invalid.length > 0}>
                                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                                Enregistrer les réglages du bot
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
