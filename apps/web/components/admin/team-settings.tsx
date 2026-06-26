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
    Search
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import Image from "next/image";
import {IconPicker} from "@/components/ui/icon-picker";
import * as LucideIcons from "lucide-react";

interface TeamMember {
    id: string;
    name: string;
    role: string;
    image?: string;
    bio?: string;
    categoryId: string;
}

interface TeamCategory {
    id: string;
    name: string;
    icon?: string;
    order: number;
    members: TeamMember[];
}

export function TeamSettings() {
    const [categories, setCategories] = useState<TeamCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Category Modal
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Partial<TeamCategory> | null>(null);

    // Member Modal
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Partial<TeamMember> | null>(null);

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const data = await apiFetch("/v1/admin/team/categories");
            setCategories(data.categories);
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la récupération de l'équipe");
        } finally {
            setLoading(false);
        }
    };

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
            fetchTeam();
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie et tous ses membres ?")) return;
        setSaving(true);
        try {
            await apiFetch(`/v1/admin/team/categories/${id}`, {
                method: "DELETE",
            });
            toast.success("Catégorie supprimée");
            fetchTeam();
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveMember = async () => {
        if (!editingMember?.name || !editingMember?.role || !editingMember?.categoryId) return;
        setSaving(true);
        try {
            await apiFetch("/v1/admin/team/members", {
                method: "POST",
                body: JSON.stringify(editingMember),
            });
            toast.success("Membre enregistré");
            setIsMemberModalOpen(false);
            fetchTeam();
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteMember = async (id: string) => {
        if (!confirm("Supprimer ce membre ?")) return;
        setSaving(true);
        try {
            await apiFetch(`/v1/admin/team/members/${id}`, {
                method: "DELETE",
            });
            toast.success("Membre supprimé");
            fetchTeam();
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
            fetchTeam();
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Équipe et Structure</h3>
                    <p className="text-sm text-muted-foreground">Gérez les catégories et les membres affichés sur la page d'accueil.</p>
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
                                    </div>
                                    <CardDescription>Ordre: {category.order}</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => moveCategory(catIndex, 'up')} disabled={catIndex === 0 || saving}>
                                    <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => moveCategory(catIndex, 'down')} disabled={catIndex === categories.length - 1 || saving}>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => {
                                    setEditingCategory(category);
                                    setIsCategoryModalOpen(true);
                                }}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteCategory(category.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {category.members.map((member, memberIndex) => (
                                    <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-muted overflow-hidden border">
                                                {member.image ? (
                                                    <Image src={member.image} alt={member.name} width={40} height={40} className="object-cover" unoptimized />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                                        <span className="text-xs text-primary font-bold">{member.name[0]}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{member.name}</p>
                                                <p className="text-xs text-muted-foreground">{member.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                                setEditingMember(member);
                                                setIsMemberModalOpen(true);
                                            }}>
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteMember(member.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="ghost" className="w-full rounded-none h-12 text-muted-foreground hover:text-primary" onClick={() => {
                                    setEditingMember({ 
                                        name: "", 
                                        role: "", 
                                        categoryId: category.id
                                    });
                                    setIsMemberModalOpen(true);
                                }}>
                                    <UserPlus className="h-4 w-4 mr-2" /> Ajouter un membre à cette catégorie
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {categories.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Aucune catégorie d'équipe définie.</p>
                    </div>
                )}
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

            {/* Member Modal */}
            <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingMember?.id ? "Modifier" : "Ajouter"} un membre</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="mem-name">Nom / Pseudo</Label>
                            <Input 
                                id="mem-name" 
                                value={editingMember?.name || ""} 
                                onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mem-role">Rôle / Titre</Label>
                            <Input 
                                id="mem-role" 
                                value={editingMember?.role || ""} 
                                onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mem-image">URL de l'image</Label>
                            <Input 
                                id="mem-image" 
                                value={editingMember?.image || ""} 
                                onChange={(e) => setEditingMember({ ...editingMember, image: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mem-bio">Biographie</Label>
                            <Textarea 
                                id="mem-bio" 
                                value={editingMember?.bio || ""} 
                                onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMemberModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleSaveMember} disabled={saving || !editingMember?.name || !editingMember?.role}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
