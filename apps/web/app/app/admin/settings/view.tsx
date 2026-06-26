"use client";

import {useEffect, useState} from "react";
import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Switch
} from "@/components/ui";
import {toast} from "sonner";
import {apiFetch} from "@/lib/api";
import {Loader2, Plus, Trash2} from "lucide-react";
import {BotClient} from "@/components/admin/bot-client";
import {TeamSettings} from "@/components/admin/team-settings";

interface Settings {
    widget_enabled: boolean;
    monitoring_categories: string[];
    planning_default_slots: RoleSlotSetting[];
}

interface RoleSlotSetting {
    role: string;
    goalCount: number;
    part?: 'first' | 'second';
}

interface NewsletterSubscriber {
    id: string;
    email: string;
    createdAt: string;
}

export default function AdminSettingsView({initialSettings, roles}: { initialSettings: Settings, roles: any[] }) {
    const [settings, setSettings] = useState<Settings>(initialSettings);
    const [loading, setLoading] = useState(false);
    const [newCategory, setNewCategory] = useState("");
    const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
    const [newSubscriberEmail, setNewSubscriberEmail] = useState("");
    const [loadingSubscribers, setLoadingSubscribers] = useState(false);

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const fetchSubscribers = async () => {
        setLoadingSubscribers(true);
        try {
            const data = await apiFetch("/v1/admin/newsletter/subscribers");
            setSubscribers(data.subscribers);
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la récupération des abonnés");
        } finally {
            setLoadingSubscribers(false);
        }
    };

    const handleAddSubscriber = async () => {
        if (!newSubscriberEmail.trim()) return;
        setLoading(true);
        try {
            await apiFetch("/v1/admin/newsletter/subscribers", {
                method: "POST",
                body: JSON.stringify({email: newSubscriberEmail.trim()}),
            });
            setNewSubscriberEmail("");
            toast.success("Abonné ajouté");
            await fetchSubscribers();
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de l'ajout de l'abonné");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSubscriber = async (id: string) => {
        setLoading(true);
        try {
            await apiFetch(`/v1/admin/newsletter/subscribers/${id}`, {
                method: "DELETE",
            });
            toast.success("Abonné supprimé");
            await fetchSubscribers();
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la suppression de l'abonné");
        } finally {
            setLoading(false);
        }
    };

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

    const handleSlotChange = async (index: number, updatedSlot: RoleSlotSetting) => {
        const updatedSlots = [...settings.planning_default_slots];
        updatedSlots[index] = updatedSlot;
        await updatePlanningSlots(updatedSlots);
    };

    const handleAddSlot = async () => {
        const newSlot: RoleSlotSetting = {
            role: roles[0]?.name || "",
            goalCount: 1
        };
        const updatedSlots = [...(settings.planning_default_slots || []), newSlot];
        await updatePlanningSlots(updatedSlots);
    };

    const handleRemoveSlot = async (index: number) => {
        const updatedSlots = settings.planning_default_slots.filter((_, i) => i !== index);
        await updatePlanningSlots(updatedSlots);
    };

    const updatePlanningSlots = async (slots: RoleSlotSetting[]) => {
        setLoading(true);
        try {
            await apiFetch("/v1/admin/settings", {
                method: "POST",
                body: JSON.stringify({
                    key: "planning_default_slots",
                    value: JSON.stringify(slots),
                }),
            });
            setSettings({...settings, planning_default_slots: slots});
            // Pas de toast de succès pour le mode auto-save
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

            <Card>
                <CardHeader>
                    <CardTitle>Planning par défaut</CardTitle>
                    <CardDescription>
                        Configurez les créneaux par défaut importés lors de la création d'un évènement au planning.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        {settings.planning_default_slots?.map((slot, index) => (
                            <div
                                key={index}
                                className="flex flex-col md:flex-row gap-3 items-end p-4 rounded-lg border bg-muted/30"
                            >
                                <div className="flex-1 w-full space-y-2">
                                    <Label>Rôle</Label>
                                    <Select
                                        value={slot.role}
                                        onValueChange={(v) => handleSlotChange(index, {...slot, role: v})}
                                        disabled={loading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choisir un rôle"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem key={role.id} value={role.name}>
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-full md:w-32 space-y-2">
                                    <Label>Objectif</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={slot.goalCount || ""}
                                        onChange={(e) => {
                                            const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                            const updatedSlots = [...settings.planning_default_slots];
                                            updatedSlots[index] = {...slot, goalCount: val};
                                            setSettings({...settings, planning_default_slots: updatedSlots});
                                        }}
                                        onBlur={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            handleSlotChange(index, {...slot, goalCount: val});
                                        }}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="flex-1 w-full space-y-2">
                                    <Label>Période</Label>
                                    <Select
                                        value={slot.part || "none"}
                                        onValueChange={(v) => handleSlotChange(index, {
                                            ...slot,
                                            part: v === "none" ? undefined : v as any
                                        })}
                                        disabled={loading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tout l'évènement"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Tout l'évènement</SelectItem>
                                            <SelectItem value="first">Première moitié</SelectItem>
                                            <SelectItem value="second">Deuxième moitié</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 shrink-0"
                                    onClick={() => handleRemoveSlot(index)}
                                    disabled={loading}
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        className="w-full border-dashed"
                        onClick={handleAddSlot}
                        disabled={loading}
                    >
                        <Plus className="h-4 w-4 mr-2"/> Ajouter un créneau
                    </Button>

                    {(!settings.planning_default_slots || settings.planning_default_slots.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Aucun créneau par défaut défini.
                        </p>
                    )}
                </CardContent>
            </Card>

            <BotClient/>

            <TeamSettings/>

            <Card>
                <CardHeader>
                    <CardTitle>Liste de diffusion Newsletter</CardTitle>
                    <CardDescription>
                        Gérez manuellement les inscrits à la newsletter publique.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                        <Input
                            placeholder="Email de l'abonné"
                            type="email"
                            value={newSubscriberEmail}
                            onChange={(e) => setNewSubscriberEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddSubscriber()}
                            disabled={loading}
                        />
                        <Button onClick={handleAddSubscriber} disabled={loading || !newSubscriberEmail.trim()}>
                            <Plus className="h-4 w-4 mr-2"/> Ajouter
                        </Button>
                    </div>

                    <div className="border rounded-md">
                        <div className="max-h-[400px] overflow-y-auto">
                            {loadingSubscribers ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {subscribers.map((subscriber) => (
                                        <div
                                            key={subscriber.id}
                                            className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{subscriber.email}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Inscrit le {new Date(subscriber.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemoveSubscriber(subscriber.id)}
                                                disabled={loading}
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    ))}
                                    {subscribers.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            Aucun abonné trouvé.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
