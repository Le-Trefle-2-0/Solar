"use client";

import {useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Activity, Bot, Calendar, Check, Copy, Key} from "lucide-react";
import {format} from "date-fns";
import {fr} from "date-fns/locale";

export function BotClient() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [setupLoading, setSetupLoading] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const res = await apiFetch("/v1/bot/status");
            setStatus(res);
        } catch (err) {
            console.error("Failed to fetch bot status", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleSetup = async () => {
        setSetupLoading(true);
        try {
            const res = await apiFetch("/v1/bot/setup", {
                method: "POST",
            });
            if (res.success) {
                setNewKey(res.apiKey);
                fetchStatus();
            }
        } catch (err) {
            console.error("Failed to setup bot", err);
        } finally {
            setSetupLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (newKey) {
            navigator.clipboard.writeText(newKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading && !status) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Chargement du statut du bot...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-6">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <Bot className="h-8 w-8 text-primary"/>
                Gestion du Bot
            </h1>

            {newKey && (
                <Alert className="mb-8 border-green-500 bg-green-50">
                    <Key className="h-4 w-4 text-green-600"/>
                    <AlertTitle className="text-green-800">Clé API générée avec succès !</AlertTitle>
                    <AlertDescription className="text-green-700 flex flex-col gap-2">
                        <p>Copiez cette clé maintenant. Pour des raisons de sécurité, elle ne sera plus affichée après
                            avoir quitté cette page.</p>
                        <div className="flex items-center gap-2 mt-2">
                            <code className="bg-white p-2 rounded border border-green-200 flex-1 break-all">
                                {newKey}
                            </code>
                            <Button size="icon" variant="outline" onClick={copyToClipboard}>
                                {copied ? <Check className="h-4 w-4 text-green-600"/> : <Copy className="h-4 w-4"/>}
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5"/>
                            Statut du Système
                        </CardTitle>
                        <CardDescription>
                            État actuel du compte bot Solar
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-sm font-medium">Compte Bot</span>
                            {status?.exists ? (
                                <Badge variant="default" className="bg-green-500">Configuré</Badge>
                            ) : (
                                <Badge variant="destructive">Non configuré</Badge>
                            )}
                        </div>
                        {status?.exists && (
                            <>
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-sm font-medium">État de connexion</span>
                                    {status.bot.isConnected ? (
                                        <Badge variant="outline"
                                               className="text-green-600 border-green-600 flex gap-1 items-center">
                                            <span className="relative flex h-2 w-2">
                                                <span
                                                    className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span
                                                    className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            Connecté
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground">Hors ligne</Badge>
                                    )}
                                </div>
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-sm font-medium flex items-center gap-1">
                                        <Calendar className="h-3 w-3"/>
                                        Dernière activité
                                    </span>
                                    <span className="text-sm">
                                        {format(new Date(status.bot.updatedAt), "Pp", {locale: fr})}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Clé API</span>
                                    {status.hasKey ? (
                                        <span className="text-xs text-muted-foreground">Active</span>
                                    ) : (
                                        <span className="text-xs text-destructive">Manquante</span>
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                    <CardFooter>
                        {!status?.exists ? (
                            <Button onClick={handleSetup} disabled={setupLoading} className="w-full">
                                {setupLoading ? "Initialisation..." : "Configurer le compte Bot"}
                            </Button>
                        ) : (
                            <Button onClick={handleSetup} variant="outline" disabled={setupLoading} className="w-full">
                                {setupLoading ? "Régénération..." : "Régénérer une clé API"}
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                {status?.exists && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="h-5 w-5"/>
                                Informations du Bot
                            </CardTitle>
                            <CardDescription>
                                Détails du profil utilisateur du bot
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Nom</p>
                                <p className="text-sm">{status.bot.name}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Email</p>
                                <p className="text-sm">{status.bot.email}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Rôles</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {status.bot.role.split(',').map((r: string) => (
                                        <Badge key={r} variant="secondary" className="text-[10px]">{r.trim()}</Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold">ID Utilisateur</p>
                                <code className="text-[10px] bg-muted p-1 rounded block">{status.bot.id}</code>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
