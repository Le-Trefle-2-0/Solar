"use client";

import {useCallback, useEffect, useState} from "react";
import {
    Badge,
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Label,
    Textarea,
} from "@/components/ui";
import {Check, CircleAlert, Copy, IdCardLanyard, Info, Loader2, ScanFace, UserRoundX} from "lucide-react";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import {toast} from "sonner";
import {apiFetch} from "@/lib/api";

/**
 * "Informations" of an écoute: vigilances noted about the person in earlier écoutes,
 * volunteers who may not take them in charge (once every 30 days), their anonymity number for
 * reports, and, for managers in an emergency, their Discord id (written in the transcript).
 */

type TicketInfo = {
    source: string;
    anonymityNumber: string;
    vigilances: { id: string; category: string; note: string | null; createdAt: string }[];
    ineligible: { id: string; name: string; until: string }[] | null;
    reveal: { available: boolean; allowed: boolean };
};

const day = (iso: string) => format(new Date(iso), "d MMMM yyyy", {locale: fr});

function CopyButton({value, label}: { value: string; label: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <Button variant="secondary" size="sm" aria-label={label}
                onClick={() => {
                    navigator.clipboard.writeText(value).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    }, () => toast.error("Copie impossible"));
                }}>
            {copied ? <Check/> : <Copy/>} {copied ? "Copié" : "Copier"}
        </Button>
    );
}

function Section({icon: Icon, title, children}: { icon: typeof Info; title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-base font-semibold">
                <Icon className="size-4 text-muted-foreground" aria-hidden/> {title}
            </h3>
            {children}
        </section>
    );
}

export function TicketInfoDialog({channelId}: { channelId: string }) {
    const [info, setInfo] = useState<TicketInfo | null>(null);
    const [failed, setFailed] = useState(false);
    const [revealing, setRevealing] = useState(false);
    const [reason, setReason] = useState("");
    const [sending, setSending] = useState(false);
    const [discordId, setDiscordId] = useState<string | null>(null);

    const load = useCallback(() => apiFetch(`/v1/tickets/${channelId}/info`).then(
        (data: TicketInfo) => {
            setInfo(data);
            setFailed(false);
        },
        () => setFailed(true),
    ), [channelId]);

    // Loaded with the écoute, so the button can flag vigilances right away
    useEffect(() => {
        const first = setTimeout(load, 0);
        return () => clearTimeout(first);
    }, [load]);

    const reveal = async () => {
        setSending(true);
        try {
            const res = await apiFetch(`/v1/tickets/${channelId}/reveal`, {method: "POST", body: JSON.stringify({reason})});
            setDiscordId(res.discordUserId);
            setRevealing(false);
            setReason("");
        } catch {
            toast.error("L'identifiant n'a pas pu être révélé");
        } finally {
            setSending(false);
        }
    };

    const vigilanceCount = info?.vigilances.length ?? 0;

    return (
        <Dialog onOpenChange={(open) => open && load()}>
            <DialogTrigger asChild>
                <Button variant="outline" className="relative"
                        aria-label={vigilanceCount ? `Informations de l'écoute, ${vigilanceCount} vigilance${vigilanceCount > 1 ? "s" : ""}` : "Informations de l'écoute"}>
                    <Info/>
                    {vigilanceCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-background" aria-hidden/>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Informations de l&apos;écoute</DialogTitle>
                    <DialogDescription>Ce que l&apos;équipe sait de la personne, sans l&apos;identifier.</DialogDescription>
                </DialogHeader>

                {!info ? (
                    failed
                        ? <p className="text-sm text-destructive">Les informations n&apos;ont pas pu être chargées.</p>
                        : <div className="flex justify-center py-6"><Loader2 className="size-5 animate-spin text-muted-foreground"/></div>
                ) : (
                    <div className="space-y-6">
                        <Section icon={CircleAlert} title="Vigilances">
                            {info.vigilances.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Aucune vigilance pour cette personne.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {info.vigilances.map(v => (
                                        <li key={v.id} className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="outline" className="border-amber-600/50 text-amber-800 dark:text-amber-300">{v.category}</Badge>
                                                <span className="text-xs text-muted-foreground">le {day(v.createdAt)}</span>
                                            </div>
                                            {v.note && <p className="mt-1.5 whitespace-pre-line break-words">{v.note}</p>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Section>

                        {info.ineligible && (
                            <Section icon={UserRoundX} title="Bénévoles inéligibles">
                                <p className="text-xs text-muted-foreground">
                                    Un bénévole ne prend en charge la même personne qu&apos;une fois tous les 30 jours, à l&apos;écrit comme en vocal.
                                </p>
                                {info.ineligible.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Tous les bénévoles peuvent prendre cette écoute.</p>
                                ) : (
                                    <ul className="divide-y rounded-md border text-sm">
                                        {info.ineligible.map(u => (
                                            <li key={u.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-3 py-2">
                                                <span className="font-medium">{u.name}</span>
                                                <span className="text-xs text-muted-foreground">de nouveau possible le {day(u.until)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </Section>
                        )}

                        <Section icon={IdCardLanyard} title="Identifiant">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-sm">Numéro d&apos;anonymat</span>
                                <code className="rounded bg-muted px-2 py-1 font-mono text-sm tracking-wider">{info.anonymityNumber}</code>
                                <CopyButton value={info.anonymityNumber} label="Copier le numéro d'anonymat"/>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Le même pour toutes les écoutes de cette personne : à reporter dans les transmissions pour la désigner sans l&apos;identifier.
                            </p>

                            <div className="space-y-2 pt-2">
                                <p className="text-sm">Identifiant Discord</p>
                                {discordId ? (
                                    <div className="flex flex-wrap items-center gap-3">
                                        <code className="rounded bg-muted px-2 py-1 font-mono text-sm">{discordId}</code>
                                        <CopyButton value={discordId} label="Copier l'identifiant Discord"/>
                                        <span className="text-xs text-muted-foreground">Révélation notée dans la transcription.</span>
                                    </div>
                                ) : !info.reveal.available ? (
                                    <p className="text-xs text-muted-foreground">
                                        {info.source !== "discord"
                                            ? "Écoute ouverte depuis le site : pas d'identifiant Discord."
                                            : "Plus disponible : l'identifiant est effacé à la fermeture de l'écoute."}
                                    </p>
                                ) : !info.reveal.allowed ? (
                                    <p className="text-xs text-muted-foreground">Réservé aux responsables, en cas d&apos;urgence.</p>
                                ) : !revealing ? (
                                    <Button variant="outline" size="sm" onClick={() => setRevealing(true)}>
                                        <ScanFace/> Révéler
                                    </Button>
                                ) : (
                                    <div className="space-y-2 rounded-md border border-destructive/40 p-3">
                                        <Label htmlFor="reveal-reason">Motif de l&apos;urgence</Label>
                                        <Textarea id="reveal-reason" value={reason} maxLength={500} rows={3}
                                                  onChange={(e) => setReason(e.target.value)}
                                                  aria-describedby="reveal-reason-help"/>
                                        <p id="reveal-reason-help" className="text-xs text-muted-foreground">
                                            Votre nom et ce motif sont notés dans la transcription de l&apos;écoute, visibles par l&apos;équipe
                                            mais jamais par la personne. 10 caractères au moins.
                                        </p>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setRevealing(false)} disabled={sending}>Annuler</Button>
                                            <Button variant="destructive" size="sm" onClick={reveal}
                                                    disabled={sending || reason.trim().length < 10}>
                                                {sending && <Loader2 className="animate-spin"/>} Révéler l&apos;identifiant
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Section>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
