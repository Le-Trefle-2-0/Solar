"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Button,
    Input,
    Label,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    Textarea
} from "@/components/ui";
import { 
    Plus, 
    Trash2, 
    Edit, 
    ChevronUp, 
    ChevronDown, 
    Loader2, 
    UserPlus,
    Search,
    Crown,
    RefreshCw,
    Unlink,
    Download
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import Image from "next/image";
import {IconPicker} from "@/components/ui/icon-picker";
import * as LucideIcons from "lucide-react";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue,
    Checkbox
} from "@/components/ui";

interface TeamPerson {
    id: string;
    name: string;
    image?: string;
    bio?: string;
    /** Linked Discord account: name and photo can follow it */
    discordId?: string | null;
    syncName?: boolean;
    syncImage?: boolean;
    discordSyncedAt?: string | null;
    discordSyncError?: string | null;
}

/** Discord user ids: 17 to 20 digits (Developer mode, right click > Copy user ID). */
const DISCORD_ID_RE = /^\d{15,22}$/;

interface TeamMember {
    id: string;
    role: string;
    isLead?: boolean;
    teamName?: string;
    categoryId: string;
    personId: string;
    person: TeamPerson;
}

interface TeamCategory {
    id: string;
    name: string;
    icon?: string;
    type?: string;
    color?: string;
    order: number;
    members: TeamMember[];
}

export function TeamSettings() {
    const [categories, setCategories] = useState<TeamCategory[]>([]);
    const [people, setPeople] = useState<TeamPerson[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Category Modal
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Partial<TeamCategory> | null>(null);

    // Member Modal
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Partial<TeamMember> | null>(null);

    // Person Modal
    const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Partial<TeamPerson> | null>(null);

    // Discord import / link
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importId, setImportId] = useState("");
    const [linkId, setLinkId] = useState("");
    const [syncingId, setSyncingId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catData, peopleData] = await Promise.all([
                apiFetch("/v1/admin/team/categories"),
                apiFetch("/v1/admin/team/people")
            ]);
            setCategories(catData.categories);
            setPeople(peopleData.people);
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la récupération des données");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveCategory = async () => {
        if (!editingCategory?.name) return;
        setSaving(true);
        try {
            await apiFetch("/v1/admin/team/categories", {
                method: "POST",
                body: JSON.stringify(editingCategory),
            });
            toast.success("Catégorie enregistrée");
            setIsCategoryModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie et toutes ses assignations ?")) return;
        setSaving(true);
        try {
            await apiFetch(`/v1/admin/team/categories/${id}`, {
                method: "DELETE",
            });
            toast.success("Catégorie supprimée");
            fetchData();
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveMember = async () => {
        if (!editingMember?.role || !editingMember?.categoryId || !editingMember?.personId) return;
        setSaving(true);
        try {
            await apiFetch("/v1/admin/team/members", {
                method: "POST",
                body: JSON.stringify(editingMember),
            });
            toast.success("Membre enregistré");
            setIsMemberModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteMember = async (id: string) => {
        if (!confirm("Supprimer cette assignation ?")) return;
        setSaving(true);
        try {
            await apiFetch(`/v1/admin/team/members/${id}`, {
                method: "DELETE",
            });
            toast.success("Assignation supprimée");
            fetchData();
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        } finally {
            setSaving(false);
        }
    };

    const handleSavePerson = async () => {
        if (!editingPerson?.name) return;
        setSaving(true);
        try {
            await apiFetch("/v1/admin/team/people", {
                method: "POST",
                body: JSON.stringify(editingPerson),
            });
            toast.success("Personne enregistrée");
            setIsPersonModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    /** Import a new person, or link `personId` to the Discord account. */
    const importFromDiscord = async (discordId: string, personId?: string) => {
        if (!DISCORD_ID_RE.test(discordId.trim())) {
            toast.error("Identifiant Discord invalide", {description: "Un identifiant Discord compte 17 à 20 chiffres."});
            return null;
        }
        setSaving(true);
        try {
            const res = await apiFetch("/v1/admin/team/people/discord", {
                method: "POST",
                body: JSON.stringify({discordId: discordId.trim(), personId}),
            });
            toast.success(personId ? "Profil lié à Discord" : `${res.person.name} importé depuis Discord`);
            fetchData();
            return res.person as TeamPerson;
        } catch (error: any) {
            toast.error("Import impossible", {description: error?.message});
            return null;
        } finally {
            setSaving(false);
        }
    };

    /** Name and photo follow Discord again, imported now. */
    const resyncPerson = async (id: string) => {
        setSyncingId(id);
        try {
            const res = await apiFetch(`/v1/admin/team/people/${id}/resync`, {method: "POST"});
            const person = res.person as TeamPerson;
            if (person.discordSyncError) toast.warning("Synchronisation partielle", {description: person.discordSyncError});
            else toast.success("Profil synchronisé avec Discord");
            if (editingPerson?.id === id) setEditingPerson(person);
            fetchData();
        } catch (error: any) {
            toast.error("Synchronisation impossible", {description: error?.message});
        } finally {
            setSyncingId(null);
        }
    };

    const unlinkPerson = async (id: string) => {
        if (!confirm("Délier ce profil de Discord ? Le nom et la photo actuels seront conservés et ne changeront plus.")) return;
        setSaving(true);
        try {
            await apiFetch(`/v1/admin/team/people/${id}/unlink`, {method: "POST"});
            toast.success("Profil délié de Discord");
            if (editingPerson?.id === id) setEditingPerson({...editingPerson, discordId: null, discordSyncedAt: null, discordSyncError: null});
            fetchData();
        } catch (error: any) {
            toast.error("Erreur", {description: error?.message});
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePerson = async (id: string) => {
        if (!confirm("Supprimer cette personne ? Toutes ses assignations seront également supprimées.")) return;
        setSaving(true);
        try {
            await apiFetch(`/v1/admin/team/people/${id}`, {
                method: "DELETE",
            });
            toast.success("Personne supprimée");
            fetchData();
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        } finally {
            setSaving(false);
        }
    };

    const moveCategory = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= categories.length) return;

        const updatedCategories = [...categories];
        const temp = updatedCategories[index].order;
        updatedCategories[index].order = updatedCategories[newIndex].order;
        updatedCategories[newIndex].order = temp;

        setSaving(true);
        try {
            await Promise.all([
                apiFetch("/v1/admin/team/categories", {
                    method: "POST",
                    body: JSON.stringify({ id: updatedCategories[index].id, name: updatedCategories[index].name, order: updatedCategories[index].order }),
                }),
                apiFetch("/v1/admin/team/categories", {
                    method: "POST",
                    body: JSON.stringify({ id: updatedCategories[newIndex].id, name: updatedCategories[newIndex].name, order: updatedCategories[newIndex].order }),
                })
            ]);
            fetchData();
        } catch (error) {
            toast.error("Erreur lors du déplacement");
        } finally {
            setSaving(false);
        }
    };


    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* --- SECTION PERSONNES --- */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-medium">Personnes</h3>
                        <p className="text-sm text-muted-foreground">Gérez les membres de l'équipe globalement (Bios, Photos).</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => {
                            setImportId("");
                            setIsImportModalOpen(true);
                        }}>
                            <Download className="h-4 w-4 mr-2" /> Importer depuis Discord
                        </Button>
                        <Button variant="outline" onClick={() => {
                            setEditingPerson({ name: "" });
                            setLinkId("");
                            setIsPersonModalOpen(true);
                        }}>
                            <UserPlus className="h-4 w-4 mr-2" /> Ajouter une personne
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {people.map(person => (
                        <Card key={person.id} className="flex flex-row items-center p-3 gap-4">
                            <div className="h-10 w-10 rounded-full bg-muted overflow-hidden border">
                                {person.image ? (
                                    <Image src={person.image} alt={person.name} width={40} height={40} className="object-cover" unoptimized />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                        <span className="text-xs text-primary font-bold">{person.name[0]}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{person.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{person.bio || "Pas de bio"}</p>
                                {person.discordId && (
                                    <p className={`text-[10px] truncate ${person.discordSyncError ? "text-destructive" : "text-muted-foreground"}`}
                                       title={person.discordSyncError || undefined}>
                                        {person.discordSyncError
                                            ? `Discord : ${person.discordSyncError}`
                                            : person.discordSyncedAt
                                                ? `Discord · synchronisé ${formatDistanceToNow(new Date(person.discordSyncedAt), {addSuffix: true, locale: fr})}`
                                                : "Discord · en attente de synchronisation"}
                                        {!person.discordSyncError && person.syncName === false && person.syncImage === false && " (personnalisé)"}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-1">
                                {person.discordId && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Resynchroniser avec Discord"
                                            aria-label={`Resynchroniser ${person.name} avec Discord`}
                                            disabled={syncingId === person.id} onClick={() => resyncPerson(person.id)}>
                                        <RefreshCw className={`h-3 w-3 ${syncingId === person.id ? "animate-spin" : ""}`} />
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Modifier ${person.name}`} onClick={() => {
                                    setEditingPerson(person);
                                    setLinkId("");
                                    setIsPersonModalOpen(true);
                                }}>
                                    <Edit className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label={`Supprimer ${person.name}`} onClick={() => handleDeletePerson(person.id)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* --- SECTION STRUCTURE --- */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-medium">Structure (Pôles & CA)</h3>
                        <p className="text-sm text-muted-foreground">Assignez les personnes aux catégories et définissez leurs rôles.</p>
                    </div>
                    <Button onClick={() => {
                        setEditingCategory({ name: "", icon: "Users", order: categories.length });
                        setIsCategoryModalOpen(true);
                    }}>
                        <Plus className="h-4 w-4 mr-2" /> Nouvelle catégorie
                    </Button>
                </div>

                <div className="space-y-4">
                    {categories.map((category, catIndex) => (
                        <Card key={category.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30 py-4 flex flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-base">{category.name}</CardTitle>
                                                <span className="text-xs bg-primary/10 text-primary p-1 rounded-full">
                                                    {(() => {
                                                        const Icon = (LucideIcons as any)[category.icon || "Users"] || LucideIcons.Users;
                                                        return <Icon className="h-4 w-4" />;
                                                    })()}
                                                </span>
                                                {category.type && category.type !== 'DEFAULT' && (
                                                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-primary/20 text-primary/70">
                                                        {category.type}
                                                    </span>
                                                )}
                                                {category.color && (
                                                    <div 
                                                        className="w-4 h-4 rounded border border-black/10" 
                                                        style={{ backgroundColor: category.color.startsWith('#') ? category.color : `var(--${category.color})` }}
                                                        title={`Couleur: ${category.color}`}
                                                    />
                                                )}
                                            </div>
                                            <CardDescription>Ordre: {category.order}</CardDescription>
                                        </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" aria-label={`Monter la catégorie ${category.name}`} onClick={() => moveCategory(catIndex, 'up')} disabled={catIndex === 0 || saving}>
                                        <ChevronUp className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" aria-label={`Descendre la catégorie ${category.name}`} onClick={() => moveCategory(catIndex, 'down')} disabled={catIndex === categories.length - 1 || saving}>
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" aria-label={`Modifier la catégorie ${category.name}`} onClick={() => {
                                        setEditingCategory(category);
                                        setIsCategoryModalOpen(true);
                                    }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" aria-label={`Supprimer la catégorie ${category.name}`} onClick={() => handleDeleteCategory(category.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {category.members.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-muted overflow-hidden border">
                                                    {member.person?.image ? (
                                                        <Image src={member.person.image} alt={member.person.name} width={40} height={40} className="object-cover" unoptimized />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                                            <span className="text-xs text-primary font-bold">{member.person?.name?.[0] || '?'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium flex items-center gap-2">
                                                        {member.person?.name || "Personne non liée"}
                                                        {member.isLead && <span title="Responsable"><Crown className="h-3 w-3 text-yellow-500" aria-hidden /><span className="sr-only">(responsable)</span></span>}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {member.role}
                                                        {member.teamName && <span className="ml-1 opacity-60">• {member.teamName}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Modifier ${member.person?.name ?? "ce membre"}`} onClick={() => {
                                                    setEditingMember(member);
                                                    setIsMemberModalOpen(true);
                                                }}>
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label={`Retirer ${member.person?.name ?? "ce membre"}`} onClick={() => handleDeleteMember(member.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="ghost" className="w-full rounded-none h-12 text-muted-foreground hover:text-primary" onClick={() => {
                                        setEditingMember({ 
                                            role: "", 
                                            categoryId: category.id,
                                            personId: ""
                                        });
                                        setIsMemberModalOpen(true);
                                    }}>
                                        <UserPlus className="h-4 w-4 mr-2" /> Assigner une personne à cette catégorie
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Category Modal */}
            <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory?.id ? "Modifier" : "Nouvelle"} catégorie</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="cat-name">Nom de la catégorie</Label>
                            <Input 
                                id="cat-name" 
                                value={editingCategory?.name || ""} 
                                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                placeholder="ex: Conseil d'Administration"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cat-icon">Icône</Label>
                            <IconPicker
                                value={editingCategory?.icon || "Users"}
                                onChange={(icon) => setEditingCategory({ ...editingCategory, icon })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cat-type">Type de catégorie</Label>
                                <Select
                                    value={editingCategory?.type || "DEFAULT"}
                                    onValueChange={(type) => setEditingCategory({ ...editingCategory, type })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DEFAULT">Liste simple</SelectItem>
                                        <SelectItem value="CONSEIL">Conseil d'Admin</SelectItem>
                                        <SelectItem value="POLE">Pôle opérationnel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {editingCategory?.type === 'POLE' && (
                                <div className="space-y-2">
                                    <Label htmlFor="cat-color">Couleur (HEX ou Variable)</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={editingCategory?.color || ""} 
                                            onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                                            placeholder="#9BD2D2 ou blue"
                                        />
                                        <div 
                                            className="w-10 h-10 rounded border" 
                                            style={{ backgroundColor: editingCategory?.color?.startsWith('#') ? editingCategory?.color : `var(--${editingCategory?.color || 'transparent'})` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleSaveCategory} disabled={saving || !editingCategory?.name}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Person Modal */}
            <Dialog open={isPersonModalOpen} onOpenChange={setIsPersonModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingPerson?.id ? "Modifier" : "Nouvelle"} personne</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {editingPerson?.id && (editingPerson.discordId ? (
                            <div className="space-y-3 rounded-md border p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm">
                                        Lié au compte Discord <span className="font-mono text-xs">{editingPerson.discordId}</span>
                                    </p>
                                    <Button variant="ghost" size="sm" onClick={() => unlinkPerson(editingPerson.id!)} disabled={saving}>
                                        <Unlink className="h-3 w-3 mr-1" /> Délier
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="pers-sync-name" className="font-normal">Nom repris de Discord</Label>
                                    <Switch id="pers-sync-name" checked={editingPerson.syncName !== false}
                                            onCheckedChange={(syncName) => setEditingPerson({ ...editingPerson, syncName })} />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="pers-sync-image" className="font-normal">Photo reprise de Discord</Label>
                                    <Switch id="pers-sync-image" checked={editingPerson.syncImage !== false}
                                            onCheckedChange={(syncImage) => setEditingPerson({ ...editingPerson, syncImage })} />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Modifier le nom ou la photo ci-dessous les personnalise : ils ne suivent plus Discord jusqu&apos;à la prochaine resynchronisation.
                                </p>
                                {editingPerson.discordSyncError && (
                                    <p className="text-xs text-destructive">{editingPerson.discordSyncError}</p>
                                )}
                                <Button variant="outline" size="sm" className="w-full" disabled={syncingId === editingPerson.id}
                                        onClick={() => resyncPerson(editingPerson.id!)}>
                                    <RefreshCw className={`h-3 w-3 mr-2 ${syncingId === editingPerson.id ? "animate-spin" : ""}`} />
                                    Resynchroniser maintenant
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="pers-link">Lier à un compte Discord (facultatif)</Label>
                                <div className="flex gap-2">
                                    <Input id="pers-link" inputMode="numeric" value={linkId} placeholder="Identifiant Discord"
                                           onChange={(e) => setLinkId(e.target.value)} />
                                    <Button variant="outline" disabled={saving || !linkId.trim()} onClick={async () => {
                                        const person = await importFromDiscord(linkId, editingPerson.id);
                                        if (person) setEditingPerson(person);
                                    }}>Lier</Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Le nom et la photo seront alors repris de Discord et tenus à jour.</p>
                            </div>
                        ))}
                        <div className="space-y-2">
                            <Label htmlFor="pers-name">Nom Complet / Pseudo</Label>
                            <Input
                                id="pers-name"
                                value={editingPerson?.name || ""}
                                onChange={(e) => setEditingPerson({
                                    ...editingPerson,
                                    name: e.target.value,
                                    // A name typed by hand no longer follows Discord
                                    ...(editingPerson?.discordId ? {syncName: false} : {}),
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pers-image">URL de la photo</Label>
                            <Input
                                id="pers-image"
                                value={editingPerson?.image?.startsWith("data:") ? "" : editingPerson?.image || ""}
                                onChange={(e) => setEditingPerson({
                                    ...editingPerson,
                                    image: e.target.value,
                                    ...(editingPerson?.discordId ? {syncImage: false} : {}),
                                })}
                                placeholder={editingPerson?.image?.startsWith("data:") ? "Photo importée (collez une URL pour la remplacer)" : "https://..."}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pers-bio">Biographie</Label>
                            <Textarea 
                                id="pers-bio" 
                                value={editingPerson?.bio || ""} 
                                onChange={(e) => setEditingPerson({ ...editingPerson, bio: e.target.value })}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPersonModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleSavePerson} disabled={saving || !editingPerson?.name}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Discord import */}
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Importer depuis Discord</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="import-discord-id">Identifiant Discord</Label>
                            <Input id="import-discord-id" inputMode="numeric" value={importId} placeholder="ex : 123456789012345678"
                                   onChange={(e) => setImportId(e.target.value)} />
                            <p className="text-xs text-muted-foreground">
                                Dans Discord : Paramètres &gt; Avancés &gt; Mode développeur, puis clic droit sur le membre &gt; Copier l&apos;identifiant.
                                Le pseudo du serveur et la photo sont importés puis tenus à jour automatiquement.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Annuler</Button>
                        <Button disabled={saving || !importId.trim()} onClick={async () => {
                            if (await importFromDiscord(importId)) setIsImportModalOpen(false);
                        }}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Importer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Member Modal (Assignment) */}
            <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingMember?.id ? "Modifier" : "Ajouter"} une assignation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="mem-person">Personne</Label>
                            <Select
                                value={editingMember?.personId || ""}
                                onValueChange={(personId) => setEditingMember({ ...editingMember, personId })}
                                disabled={!!editingMember?.id}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir une personne..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {people.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mem-role">Rôle / Titre dans ce pôle</Label>
                            <Input 
                                id="mem-role" 
                                value={editingMember?.role || ""} 
                                onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                                placeholder="ex: Responsable Administratif"
                            />
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                            <Checkbox 
                                id="mem-lead" 
                                checked={editingMember?.isLead || false} 
                                onCheckedChange={(checked) => setEditingMember({ ...editingMember, isLead: !!checked })}
                            />
                            <Label htmlFor="mem-lead" className="cursor-pointer">Responsable du pôle</Label>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mem-team">Équipe spécifique (Optionnel)</Label>
                            <Input 
                                id="mem-team" 
                                value={editingMember?.teamName || ""} 
                                onChange={(e) => setEditingMember({ ...editingMember, teamName: e.target.value })}
                                placeholder="ex: Modération"
                                list="existing-teams"
                            />
                            <datalist id="existing-teams">
                                {Array.from(new Set(
                                    categories.find(c => c.id === editingMember?.categoryId)
                                        ?.members.map(m => m.teamName)
                                        .filter(Boolean) || []
                                )).map(team => (
                                    <option key={team} value={team!} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMemberModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleSaveMember} disabled={saving || !editingMember?.personId || !editingMember?.role}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
