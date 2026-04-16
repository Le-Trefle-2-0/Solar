"use client";

import {useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Switch} from "@/components/ui";
import {toast} from "sonner";
import {apiFetch} from "@/lib/api";
import {Loader2} from "lucide-react";
import {BotClient} from "@/components/admin/bot-client";

interface Settings {
    widget_enabled: boolean;
}

export default function AdminSettingsView({initialSettings}: { initialSettings: Settings }) {
    const [settings, setSettings] = useState<Settings>(initialSettings);
    const [loading, setLoading] = useState(false);

    const handleToggleWidget = async (checked: boolean) => {
        setLoading(true);
        try {
            await apiFetch("/v1/admin/settings", {
                method: "POST",
                body: JSON.stringify({
                    key: "widget_enabled",
                    value: checked ? "true" : "false",
                }),
            });
            setSettings({...settings, widget_enabled: checked});
            toast.success("Paramètre mis à jour");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la mise à jour");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Widget de Chat</CardTitle>
                    <CardDescription>
                        Gérez l'affichage du widget de support sur le site public.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="widget_enabled"
                            checked={settings.widget_enabled}
                            onCheckedChange={(checked) => handleToggleWidget(checked)}
                            disabled={loading}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="widget_enabled"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Activer le widget de chat
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Si désactivé, le widget n'apparaîtra plus sur la page d'accueil publique.
                            </p>
                        </div>
                        {loading && <Loader2 className="h-4 w-4 animate-spin ml-2"/>}
                    </div>
                </CardContent>
            </Card>

            <BotClient/>
        </div>
    );
}
