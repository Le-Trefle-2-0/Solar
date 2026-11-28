"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {
    Alert,
    AlertDescription,
    AlertTitle,
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui";
import {Check, ExternalLink, Hash, KeyRound, Loader2, MoreHorizontal, RefreshCw} from "lucide-react";
import {formatDistanceToNow} from "date-fns";
import {fr} from "date-fns/locale";
import {toast} from "sonner";
import {apiFetch} from "@/lib/api";

/**
 * Set-up of the Discord bot, in steps: its Solar account (automatic), the Discord token (the
 * only thing copied from Discord), the server, then channels and opening message picked from
 * lists. The bot process picks everything up by itself.
 */

type ChannelIds = {
    openingChannelId: string | null;
    openingMessageId: string | null;
    announceChannelId: string | null;
    helpChannelId: string | null;
};

type SetupState = {
    account: { exists: boolean; hasKey: boolean };
    connected: boolean;
    discord:
        | { source: "solar"; applicationId: string; botName: string; botAvatar: string | null; guildId: string | null; guildName: string | null; inviteUrl: string }
        | { source: "env" | "unreadable" }
        | null;
    channels: ChannelIds;
    publishOpeningMessage: boolean;
};

type Guild = { id: string; name: string; iconUrl: string | null };
type Channel = { id: string; name: string; category: string | null };
type BotMessage = { id: string; createdAt: string; preview: string };

type Step = "token" | "guild" | "channels" | "connect";
const STEPS: { key: Step; label: string }[] = [
    {key: "token", label: "Jeton"},
    {key: "guild", label: "Serveur"},
    {key: "channels", label: "Salons"},
    {key: "connect", label: "Connexion"},
];

const NONE = "none";
const NEW_MESSAGE = "new";

const ERRORS: Record<string, string> = {
    invalid_token: "Discord refuse ce jeton. Copiez-le à nouveau depuis l'onglet Bot du portail développeurs (« Reset Token »).",
    forbidden: "Le bot n'a pas accès à cet élément sur Discord. Vérifiez ses permissions sur le serveur.",
    not_found: "Introuvable sur Discord : le bot a peut-être été retiré du serveur.",
    unavailable: "Discord ne répond pas pour le moment. Réessayez dans un instant.",
    no_token: "Indiquez d'abord le jeton du bot.",
    token_unreadable: "Le jeton enregistré ne peut plus être lu. Indiquez-le à nouveau.",
    no_guild: "Choisissez d'abord le serveur.",
    unknown_channels: "Certains salons n'existent plus sur ce serveur. Choisissez-les à nouveau.",
};
const errorText = (e: unknown) => ERRORS[(e as Error)?.message] ?? "L'opération n'a pas abouti. Réessayez dans un instant.";

const channelLabel = (c: Channel) => (c.category ? `${c.name} · ${c.category}` : c.name);

export function DiscordBotSetup() {
    const [state, setState] = useState<SetupState | null>(null);
    const [channelsOf, setChannelsOf] = useState<{ guildId: string; text: Channel[] } | null>(null);
    const [wizard, setWizard] = useState<Step | null>(null);
    const [rotating, setRotating] = useState(false);

    const refresh = useCallback(async () => {
        try {
            const next: SetupState = await apiFetch("/v1/bot/setup");
            setState(next);
            return next;
        } catch {
            toast.error("Impossible de lire l'état du bot Discord");
            return null;
        }
    }, []);

    useEffect(() => {
        apiFetch("/v1/bot/setup")
            .then(setState)
            .catch(() => toast.error("Impossible de lire l'état du bot Discord"));
    }, []);

    // Channel names for the summary
    const guildId = state?.discord && "guildId" in state.discord ? state.discord.guildId : null;
    useEffect(() => {
        if (!guildId || wizard) return;
        apiFetch("/v1/bot/setup/channels")
            .then((list) => setChannelsOf({guildId, ...list}))
            .catch(() => undefined);
    }, [guildId, wizard]);
    const channels = channelsOf && channelsOf.guildId === guildId ? channelsOf : null;

    const rotateKey = async () => {
        setRotating(true);
        try {
            await apiFetch("/v1/bot/setup/rotate-key", {method: "POST"});
            toast.success("Nouvelle clé créée : le bot la reprend d'ici 30 secondes");
        } catch (e) {
            toast.error(errorText(e));
        } finally {
            setRotating(false);
        }
    };

    if (!state) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Bot Discord</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>
                </CardContent>
            </Card>
        );
    }

    const discord = state.discord?.source === "solar" ? state.discord : null;
    const ready = !!discord?.guildId && !!state.channels.openingChannelId;
    const nameOf = (id: string | null, list?: Channel[]) => {
        if (!id) return null;
        const found = list?.find(c => c.id === id);
        return found ? found.name : "salon introuvable";
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                        <CardTitle>Bot Discord</CardTitle>
                        <CardDescription>
                            Permet aux personnes du serveur Discord d&apos;ouvrir une écoute en messages privés.
                        </CardDescription>
                    </div>
                    {discord && (
                        state.connected ? (
                            <Badge variant="outline" className="shrink-0 border-green-600 text-green-700 dark:text-green-400">Connecté</Badge>
                        ) : (
                            <Badge variant="outline" className="shrink-0 text-muted-foreground">Hors ligne</Badge>
                        )
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {state.discord?.source === "unreadable" && (
                    <Alert variant="destructive">
                        <AlertTitle>Le jeton enregistré ne peut plus être lu</AlertTitle>
                        <AlertDescription>
                            Le secret interne du serveur (INTERNAL_API_SECRET) a changé. Indiquez à nouveau le jeton du bot.
                        </AlertDescription>
                    </Alert>
                )}
                {state.discord?.source === "env" && (
                    <Alert>
                        <AlertTitle>Le bot utilise encore le fichier .env</AlertTitle>
                        <AlertDescription>
                            Configurez-le ici pour choisir le serveur et les salons sans copier d&apos;identifiants.
                        </AlertDescription>
                    </Alert>
                )}

                {discord ? (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
                            {discord.botAvatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={discord.botAvatar} alt="" className="h-10 w-10 rounded-full"/>
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-muted"/>
                            )}
                            <div className="min-w-0">
                                <p className="truncate font-medium">{discord.botName}</p>
                                <p className="truncate text-sm text-muted-foreground">
                                    {discord.guildName ?? "Aucun serveur choisi"}
                                </p>
                            </div>
                        </div>
                        <dl className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
                            <dt className="text-muted-foreground">Ouverture des écoutes</dt>
                            <dd className="truncate">{nameOf(state.channels.openingChannelId, channels?.text) ?? "À choisir"}</dd>
                            <dt className="text-muted-foreground">Annonce</dt>
                            <dd className="truncate">{nameOf(state.channels.announceChannelId, channels?.text) ?? "Aucune"}</dd>
                        </dl>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        La configuration prend quelques minutes : Solar crée le compte du bot, vous collez le jeton du bot
                        Discord, puis vous choisissez le serveur et les salons dans des listes.
                    </p>
                )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
                {!discord ? (
                    <Button onClick={() => setWizard("token")}>Configurer le bot</Button>
                ) : !ready ? (
                    <Button onClick={() => setWizard(discord.guildId ? "channels" : "guild")}>Reprendre la configuration</Button>
                ) : (
                    <>
                        <Button variant="outline" onClick={() => setWizard("channels")}>Modifier les salons</Button>
                        <Button variant="outline" onClick={() => setWizard("guild")}>Changer de serveur</Button>
                    </>
                )}
                {discord && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Autres actions">
                                {rotating ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4"/>}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setWizard("token")}>
                                <KeyRound className="mr-2 h-4 w-4"/> Changer le jeton Discord
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={rotateKey}>
                                <RefreshCw className="mr-2 h-4 w-4"/> Renouveler la clé Solar du bot
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </CardFooter>

            {wizard && (
                <SetupWizard
                    initialStep={wizard}
                    state={state}
                    onClose={() => {
                        setWizard(null);
                        refresh();
                    }}
                    refresh={refresh}
                />
            )}
        </Card>
    );
}

function SetupWizard({initialStep, state, onClose, refresh}: {
    initialStep: Step;
    state: SetupState;
    onClose: () => void;
    refresh: () => Promise<SetupState | null>;
}) {
    const [step, setStep] = useState<Step>(initialStep);
    const hasToken = state.discord?.source === "solar";
    const current = STEPS.findIndex(s => s.key === step);

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            {/* One column that never grows past the dialog: long names and previews are cut instead */}
            <DialogContent className="grid-cols-1 sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden [&>*]:min-w-0">
                <DialogHeader>
                    <DialogTitle>Configurer le bot Discord</DialogTitle>
                    <DialogDescription asChild>
                        <ol className="flex flex-wrap gap-x-4 gap-y-1 pt-1" aria-label="Étapes">
                            {STEPS.map((s, i) => (
                                <li key={s.key}
                                    aria-current={i === current ? "step" : undefined}
                                    className={i === current ? "font-medium text-foreground" : i < current ? "text-foreground/70" : "text-muted-foreground"}>
                                    {i < current ? <Check className="mr-1 inline h-3.5 w-3.5"/> : `${i + 1}. `}{s.label}
                                </li>
                            ))}
                        </ol>
                    </DialogDescription>
                </DialogHeader>

                {step === "token" && (
                    <TokenStep canKeep={hasToken} onDone={() => setStep("guild")}/>
                )}
                {step === "guild" && (
                    <GuildStep currentGuildId={state.discord && "guildId" in state.discord ? state.discord.guildId : null}
                               onBack={() => setStep("token")}
                               onDone={() => setStep("channels")}/>
                )}
                {step === "channels" && (
                    <ChannelsStep onBack={() => setStep("guild")}
                                  onDone={() => setStep("connect")}
                                  refresh={refresh}/>
                )}
                {step === "connect" && <ConnectStep refresh={refresh} onClose={onClose}/>}
            </DialogContent>
        </Dialog>
    );
}

function TokenStep({canKeep, onDone}: { canKeep: boolean; onDone: () => void }) {
    const [account, setAccount] = useState<"pending" | "ready" | "failed">("pending");
    const [token, setToken] = useState("");
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // The bot's Solar account and API key: created without asking anything
    useEffect(() => {
        apiFetch("/v1/bot/setup/account", {method: "POST"})
            .then(() => setAccount("ready"))
            .catch(() => setAccount("failed"));
    }, []);

    const check = async () => {
        setChecking(true);
        setError(null);
        try {
            await apiFetch("/v1/bot/setup/token", {method: "POST", body: JSON.stringify({token})});
            setToken("");
            onDone();
        } catch (e) {
            setError(errorText(e));
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="space-y-5">
            <p className="flex items-center gap-2 text-sm">
                {account === "pending" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>}
                {account === "ready" && <Check className="h-4 w-4 text-green-600"/>}
                {account === "pending" ? "Création du compte Solar du bot…"
                    : account === "ready" ? "Compte Solar du bot prêt, avec sa clé d'accès."
                        : "Le compte Solar du bot n'a pas pu être créé. Fermez puis rouvrez cette fenêtre."}
            </p>

            <div className="space-y-2 text-sm">
                <p className="font-medium">Récupérer le jeton du bot</p>
                <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                    <li>
                        Ouvrez le{" "}
                        <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer"
                           className="text-foreground underline underline-offset-2">
                            portail développeurs Discord <ExternalLink className="inline h-3 w-3"/>
                        </a>{" "}
                        et choisissez l&apos;application du bot (ou créez-en une avec « New Application »).
                    </li>
                    <li>Dans l&apos;onglet « Bot », cliquez sur « Reset Token » puis copiez le jeton.</li>
                    <li>Collez-le ci-dessous : Solar le vérifie auprès de Discord et le garde chiffré.</li>
                </ol>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="discord-token">Jeton du bot</Label>
                <Input id="discord-token" type="password" autoComplete="off" spellCheck={false}
                       value={token} onChange={(e) => setToken(e.target.value)}
                       onKeyDown={(e) => e.key === "Enter" && token.trim() && check()}
                       aria-invalid={!!error} aria-describedby="discord-token-error"/>
                {error && <p id="discord-token-error" className="text-sm text-destructive">{error}</p>}
            </div>

            <DialogFooter className="gap-2">
                {canKeep && (
                    <Button variant="ghost" onClick={onDone} disabled={checking}>Garder le jeton actuel</Button>
                )}
                <Button onClick={check} disabled={checking || !token.trim() || account !== "ready"}>
                    {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Vérifier le jeton
                </Button>
            </DialogFooter>
        </div>
    );
}

function GuildStep({currentGuildId, onBack, onDone}: {
    currentGuildId: string | null;
    onBack: () => void;
    onDone: () => void;
}) {
    const [guilds, setGuilds] = useState<Guild[] | null>(null);
    const [invite, setInvite] = useState<string | null>(null);
    const [selected, setSelected] = useState<string | null>(currentGuildId);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(() => apiFetch("/v1/bot/setup/guilds").then(
        (data: { guilds: Guild[]; inviteUrl: string }) => {
            setGuilds(data.guilds);
            setInvite(data.inviteUrl);
            setSelected(sel => sel ?? (data.guilds.length === 1 ? data.guilds[0].id : null));
            setError(null);
        },
        (e) => setError(errorText(e)),
    ), []);

    // After "Ajouter le bot à un serveur" in another tab, the new server shows up by itself
    useEffect(() => {
        const first = setTimeout(load, 0);
        const timer = setInterval(load, 5000);
        window.addEventListener("focus", load);
        return () => {
            clearTimeout(first);
            clearInterval(timer);
            window.removeEventListener("focus", load);
        };
    }, [load]);

    const save = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await apiFetch("/v1/bot/setup/guild", {method: "POST", body: JSON.stringify({guildId: selected})});
            onDone();
        } catch (e) {
            setError(errorText(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
                Choisissez le serveur de l&apos;association. Si le bot n&apos;y est pas encore, ajoutez-le : Discord
                vous demande de choisir le serveur et d&apos;accepter les permissions, puis il apparaît ici.
            </p>

            {guilds === null && !error ? (
                <div className="flex justify-center py-4" role="status"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/><span className="sr-only">Chargement…</span></div>
            ) : guilds && guilds.length > 0 ? (
                <div role="radiogroup" aria-label="Serveur Discord" className="grid gap-2 sm:grid-cols-2">
                    {guilds.map(g => (
                        <button key={g.id} type="button" role="radio" aria-checked={selected === g.id}
                                onClick={() => setSelected(g.id)}
                                className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected === g.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                            {g.iconUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={g.iconUrl} alt="" className="h-8 w-8 rounded-full"/>
                            ) : (
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                    {g.name.slice(0, 2)}
                                </span>
                            )}
                            <span className="min-w-0 flex-1 truncate font-medium">{g.name}</span>
                            {selected === g.id && <Check className="h-4 w-4 text-primary"/>}
                        </button>
                    ))}
                </div>
            ) : (
                <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Le bot n&apos;est encore sur aucun serveur. Ajoutez-le avec le bouton ci-dessous.
                </p>
            )}

            {invite && (
                <Button variant="outline" asChild className="w-full">
                    <a href={invite} target="_blank" rel="noreferrer">
                        Ajouter le bot à un serveur <ExternalLink className="ml-2 h-4 w-4"/>
                        <span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
                    </a>
                </Button>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={onBack} disabled={saving}>Retour</Button>
                <Button onClick={save} disabled={saving || !selected}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Continuer
                </Button>
            </DialogFooter>
        </div>
    );
}

function ChannelSelect({id, label, help, value, onChange, channels, optional}: {
    id: string;
    label: string;
    help: string;
    value: string | null;
    onChange: (v: string | null) => void;
    channels: Channel[];
    optional?: string;
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
                <SelectTrigger id={id} aria-describedby={`${id}-help`} className="w-full min-w-0 [&>span]:truncate">
                    <SelectValue placeholder="Choisir un salon"/>
                </SelectTrigger>
                <SelectContent>
                    {optional && <SelectItem value={NONE}>{optional}</SelectItem>}
                    {channels.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                            <Hash className="h-3.5 w-3.5 text-muted-foreground"/> {channelLabel(c)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <p id={`${id}-help`} className="text-xs text-muted-foreground">{help}</p>
        </div>
    );
}

function ChannelsStep({onBack, onDone, refresh}: {
    onBack: () => void;
    onDone: () => void;
    refresh: () => Promise<SetupState | null>;
}) {
    const [channels, setChannels] = useState<{ text: Channel[] } | null>(null);
    const [values, setValues] = useState<ChannelIds | null>(null);
    const [message, setMessage] = useState<string>(NEW_MESSAGE);
    const [messagesOf, setMessagesOf] = useState<{ channelId: string; list: BotMessage[] } | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const savedMessage = useRef<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const [list, current] = await Promise.all([apiFetch("/v1/bot/setup/channels"), refresh()]);
                setChannels(list);
                const ids = current?.channels ?? {
                    openingChannelId: null, openingMessageId: null, announceChannelId: null, helpChannelId: null,
                };
                // Former choices that no longer exist on this server are dropped
                const keep = (id: string | null, pool: Channel[]) => (id && pool.some(c => c.id === id) ? id : null);
                savedMessage.current = ids.openingMessageId;
                setValues({
                    openingChannelId: keep(ids.openingChannelId, list.text),
                    openingMessageId: ids.openingMessageId,
                    announceChannelId: keep(ids.announceChannelId, list.text),
                    helpChannelId: keep(ids.helpChannelId, list.text),
                });
            } catch (e) {
                setError(errorText(e));
            }
        })();
    }, [refresh]);

    // The bot's messages in the opening channel: the one to edit, or a new one
    const openingChannelId = values?.openingChannelId ?? null;
    useEffect(() => {
        if (!openingChannelId) return;
        apiFetch(`/v1/bot/setup/messages?channelId=${openingChannelId}`)
            .then((data: { messages: BotMessage[] }) => {
                setMessagesOf({channelId: openingChannelId, list: data.messages});
                const saved = savedMessage.current;
                setMessage(saved && data.messages.some(m => m.id === saved) ? saved : data.messages[0]?.id ?? NEW_MESSAGE);
            })
            .catch((e) => {
                setMessagesOf({channelId: openingChannelId, list: []});
                setMessage(NEW_MESSAGE);
                setError(errorText(e));
            });
    }, [openingChannelId]);
    const messages = messagesOf && messagesOf.channelId === openingChannelId ? messagesOf.list : null;

    const save = async () => {
        if (!values?.openingChannelId) return;
        setSaving(true);
        setError(null);
        try {
            const publish = message === NEW_MESSAGE;
            await apiFetch("/v1/bot/discord-settings", {
                method: "PUT",
                body: JSON.stringify({
                    ...values,
                    openingMessageId: publish ? null : message,
                    publishOpeningMessage: publish,
                }),
            });
            onDone();
        } catch (e) {
            setError(errorText(e));
        } finally {
            setSaving(false);
        }
    };

    if (!channels || !values) {
        return error
            ? <p className="text-sm text-destructive">{error}</p>
            : <div className="flex justify-center py-6" role="status"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/><span className="sr-only">Chargement…</span></div>;
    }

    const set = (key: keyof ChannelIds) => (v: string | null) => setValues({...values, [key]: v});

    return (
        <div className="space-y-5">
            <ChannelSelect id="opening-channel" label="Salon d'ouverture des écoutes"
                           help="Le salon où se trouve le message avec le bouton « Ouvrir une écoute »."
                           value={values.openingChannelId} onChange={set("openingChannelId")} channels={channels.text}/>

            {values.openingChannelId && (
                // A fieldset is as wide as its content by default (min-width: min-content): min-w-0 keeps it in the dialog
                <fieldset className="min-w-0 space-y-2">
                    <legend className="text-sm font-medium">Message d&apos;ouverture</legend>
                    <p className="text-xs text-muted-foreground">
                        Le bot modifie ce message à chaque ouverture et fermeture de la permanence. Seuls ses propres
                        messages peuvent être modifiés.
                    </p>
                    {messages === null ? (
                        <div className="flex justify-center py-2" role="status"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/><span className="sr-only">Chargement…</span></div>
                    ) : (
                        <div className="space-y-1.5">
                            {messages.map(m => (
                                <label key={m.id}
                                       className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm ${message === m.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                                    <input type="radio" name="opening-message" className="mt-1 accent-[var(--primary)]"
                                           checked={message === m.id} onChange={() => setMessage(m.id)}/>
                                    <span className="min-w-0 flex-1">
                                        <span className="line-clamp-2 break-words" title={m.preview}>{m.preview}</span>
                                        <span className="block text-xs text-muted-foreground">
                                            Publié {formatDistanceToNow(new Date(m.createdAt), {addSuffix: true, locale: fr})}
                                        </span>
                                    </span>
                                </label>
                            ))}
                            <label className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm ${message === NEW_MESSAGE ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                                <input type="radio" name="opening-message" className="mt-1 accent-[var(--primary)]"
                                       checked={message === NEW_MESSAGE} onChange={() => setMessage(NEW_MESSAGE)}/>
                                <span>
                                    <span className="block">Publier un nouveau message</span>
                                    <span className="block text-xs text-muted-foreground">
                                        {messages.length === 0 ? "Le bot n'a encore aucun message dans ce salon." : "L'ancien message reste en place, sans être modifié."}
                                    </span>
                                </span>
                            </label>
                        </div>
                    )}
                </fieldset>
            )}

            <ChannelSelect id="announce-channel" label="Salon d'annonce" optional="Pas d'annonce"
                           help="Le bot y annonce l'ouverture de la permanence."
                           value={values.announceChannelId} onChange={set("announceChannelId")} channels={channels.text}/>
            <ChannelSelect id="help-channel" label="Salon des autres supports d'écoute" optional="Celui de l'ancien bot"
                           help="Indiqué aux personnes quand la permanence est fermée."
                           value={values.helpChannelId} onChange={set("helpChannelId")} channels={channels.text}/>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={onBack} disabled={saving}>Retour</Button>
                <Button onClick={save} disabled={saving || !values.openingChannelId || messages === null}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Enregistrer les salons
                </Button>
            </DialogFooter>
        </div>
    );
}

function ConnectStep({refresh, onClose}: { refresh: () => Promise<SetupState | null>; onClose: () => void }) {
    const [connected, setConnected] = useState(false);
    const [slow, setSlow] = useState(false);

    // The bot process checks its set-up every 30 seconds
    useEffect(() => {
        let stopped = false;
        const started = Date.now();
        const poll = async () => {
            const next = await refresh();
            if (stopped) return;
            if (next?.connected) return setConnected(true);
            if (Date.now() - started > 60_000) setSlow(true);
            setTimeout(poll, 3000);
        };
        poll();
        return () => {
            stopped = true;
        };
    }, [refresh]);

    return (
        <div className="space-y-5">
            <div role="status" className="flex items-start gap-3 rounded-md border p-4 text-sm">
                {connected ? <Check className="mt-0.5 h-5 w-5 text-green-600"/> : <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-muted-foreground"/>}
                <div className="space-y-1">
                    <p className="font-medium">{connected ? "Le bot est connecté" : "Le bot reprend sa configuration…"}</p>
                    <p className="text-muted-foreground">
                        {connected
                            ? "Il met à jour le message d'ouverture selon le planning des permanences. Les changements de salons s'appliquent tout de suite."
                            : "Cela prend jusqu'à 30 secondes."}
                    </p>
                    {slow && !connected && (
                        <p className="text-muted-foreground">
                            Toujours rien ? Vérifiez que le service du bot est lancé sur le serveur (npm run start:bot, ou
                            npm run dev:all en développement) et consultez ses journaux.
                        </p>
                    )}
                </div>
            </div>
            <DialogFooter>
                <Button onClick={onClose}>{connected ? "Terminer" : "Fermer"}</Button>
            </DialogFooter>
        </div>
    );
}
