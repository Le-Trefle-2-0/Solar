"use client";

import {useState} from "react";
import {Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Switch} from "@/components/ui";
import {toast} from "sonner";
import {apiFetch} from "@/lib/api";
import {Loader2, Plus, Trash2} from "lucide-react";
import {BotClient} from "@/components/admin/bot-client";

interface Settings {
    widget_enabled: boolean;
    monitoring_categories: string[];
}

export default function AdminSettingsView({initialSettings}: { initialSettings: Settings }) {
    const [settings, setSettings] = useState<Settings>(initialSettings);
    const [loading, setLoading] = useState(false);
    const [newCategory, setNewCategory] = useState("");

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

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;
        if (settings.monitoring_categories.includes(newCategory.trim())) {
            return toast.error("Cette catégorie existe déjà");
        }

        const updatedCategories = [...settings.monitoring_categories, newCategory.trim()];
        await updateCategories(updatedCategories);
        setNewCategory("");
    };

    const handleRemoveCategory = async (category: string) => {
        const updatedCategories = settings.monitoring_categories.filter(c => c !== category);
        await updateCategories(updatedCategories);
    };

    const updateCategories = async (categories: string[]) => {
        setLoading(true);
        try {
            await apiFetch("/v1/admin/settings", {
                method: "POST",
                body: JSON.stringify({
                    key: "monitoring_categories",
                    value: JSON.stringify(categories),
                }),
            });
            setSettings({...settings, monitoring_categories: categories});
            toast.success("Catégories mises à jour");
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

            <Card>
                <CardHeader>
                    <CardTitle>Catégories de Monitoring</CardTitle>
                    <CardDescription>
                        Définissez les catégories disponibles lors de la rédaction des transmissions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                        <Input
                            placeholder="Nouvelle catégorie (ex: Solitude, Stress...)"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                            disabled={loading}
                        />
                        <Button onClick={handleAddCategory} disabled={loading || !newCategory.trim()}>
                            <Plus className="h-4 w-4 mr-2"/> Ajouter
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {settings.monitoring_categories?.map((category) => (
                            <div
                                key={category}
                                className="flex items-center justify-between p-2 rounded-md border bg-muted/50"
                            >
                                <span className="text-sm">{category}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRemoveCategory(category)}
                                    disabled={loading}
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                        ))}
                    </div>
                    {settings.monitoring_categories?.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Aucune catégorie définie.
                        </p>
                    )}
                </CardContent>
            </Card>

            <BotClient/>
        </div>
    );
}
