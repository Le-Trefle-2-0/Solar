"use client";

import {apiFetch} from "@/lib/api";
import {useEffect, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Checkbox} from "@/components/ui/checkbox";
import * as Icons from "lucide-react";
import {ArrowDown, ArrowUp, Plus, Save, Shield, Trash2} from "lucide-react";
import {IconPicker} from "@/components/ui/icon-picker";
import {PERMISSION_METADATA, statement} from "@/lib/permissions";
import {ScrollArea, Separator} from "@/components/ui";
import {toast} from "sonner";

interface Role {
    id: string;
    name: string;
    permissions: string; // JSON
    weight: number;
    icon?: string;
}

const CATEGORIZED_PERMISSIONS = Object.entries(statement).reduce((acc, [category, perms]) => {
    if (Array.isArray(perms)) {
        const catName = category.charAt(0).toUpperCase() + category.slice(1);
        acc[catName] = perms.map(p => {
            const id = `${category}.${p}`;
            const meta = PERMISSION_METADATA[id];
            return {
                id,
                label: meta?.label || `${catName}: ${p}`
            };
        });
    }
    return acc;
}, {} as Record<string, { id: string, label: string }[]>);

export function RolesManager() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);

    const fetchRoles = async () => {
        try {
            const res = await apiFetch("/v1/admin/roles");
            if (res.roles) {
                setRoles(res.roles);
            }
        } catch (error) {
            toast.error("Erreur lors de la récupération des rôles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleSave = async () => {
        if (!editingRole?.name) return toast.error("Le nom du rôle est requis");

        try {
            await apiFetch("/v1/admin/roles", {
                method: "POST",
                body: JSON.stringify({
                    name: editingRole.name,
                    permissions: editingRole.permissions || "[]",
                    weight: editingRole.weight || 0,
                    icon: editingRole.icon
                })
            });
            toast.success("Rôle enregistré avec succès");
            setEditingRole(null);
            fetchRoles();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'enregistrement");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce rôle ?")) return;
        try {
            await apiFetch(`/v1/admin/roles/${id}`, {method: "DELETE"});
            toast.success("Rôle supprimé");
            fetchRoles();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la suppression");
        }
    };

    const togglePermission = (permId: string) => {
        if (!editingRole) return;
        const currentPerms = JSON.parse(editingRole.permissions || "[]") as string[];
        const newPerms = currentPerms.includes(permId)
            ? currentPerms.filter(p => p !== permId)
            : [...currentPerms, permId];
        setEditingRole({...editingRole, permissions: JSON.stringify(newPerms)});
    };

    const renderRoleIcon = (role: Role) => {
        const Icon = (Icons as any)[role.icon || "Shield"];
        return <Icon className={`h-4 w-4 ${role.weight > 50 ? 'text-primary' : 'text-muted-foreground'}`}/>;
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Rôles</CardTitle>
                        <Button size="sm" onClick={() => setEditingRole({name: "", permissions: "[]", weight: 0})}>
                            <Plus className="h-4 w-4 mr-2"/> Nouveau
                        </Button>
                    </div>
                    <CardDescription>Hiérarchie des rôles (poids décroissant)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${editingRole?.id === role.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted'}`}
                            onClick={() => setEditingRole(role)}
                        >
                            <div className="flex items-center gap-3">
                                {renderRoleIcon(role)}
                                <div>
                                    <p className="font-medium">{role.name}</p>
                                    <p className="text-xs text-muted-foreground">Poids: {role.weight}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(role.id);
                                        }}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>{editingRole?.id ? "Modifier le rôle" : "Créer un rôle"}</CardTitle>
                    <CardDescription>Configurez le nom, la hiérarchie et les permissions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!editingRole ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Shield className="h-12 w-12 mb-4 opacity-20"/>
                            <p>Sélectionnez un rôle à modifier ou créez-en un nouveau.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nom du rôle</Label>
                                    <Input
                                        value={editingRole.name}
                                        onChange={(e) => setEditingRole({...editingRole, name: e.target.value})}
                                        placeholder="ex: Modérateur"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Icône</Label>
                                    <IconPicker
                                        value={editingRole.icon || "Shield"}
                                        onChange={(icon) => setEditingRole({...editingRole, icon})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Poids (Hiérarchie)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={editingRole.weight}
                                            onChange={(e) => setEditingRole({
                                                ...editingRole,
                                                weight: parseInt(e.target.value) || 0
                                            })}
                                        />
                                        <div className="flex flex-col">
                                            <Button variant="outline" size="icon"
                                                    className="h-5 w-5 rounded-none rounded-t-sm"
                                                    onClick={() => setEditingRole({
                                                        ...editingRole,
                                                        weight: (editingRole.weight || 0) + 1
                                                    })}>
                                                <ArrowUp className="h-3 w-3"/>
                                            </Button>
                                            <Button variant="outline" size="icon"
                                                    className="h-5 w-5 rounded-none rounded-b-sm"
                                                    onClick={() => setEditingRole({
                                                        ...editingRole,
                                                        weight: Math.max(0, (editingRole.weight || 0) - 1)
                                                    })}>
                                                <ArrowDown className="h-3 w-3"/>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator/>

                            <div className="space-y-4">
                                <Label className="text-base font-bold">Permissions</Label>
                                <ScrollArea className="h-[400px] pr-4">
                                    <div className="space-y-6">
                                        {Object.entries(CATEGORIZED_PERMISSIONS).map(([category, perms]) => (
                                            <div key={category} className="space-y-3">
                                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{category}</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {perms.map((perm) => {
                                                        const isChecked = JSON.parse(editingRole.permissions || "[]").includes(perm.id);
                                                        return (
                                                            <div key={perm.id}
                                                                 className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 border transition-colors">
                                                                <Checkbox
                                                                    id={perm.id}
                                                                    checked={isChecked}
                                                                    onCheckedChange={() => togglePermission(perm.id)}
                                                                />
                                                                <label
                                                                    htmlFor={perm.id}
                                                                    className="text-sm font-medium leading-none cursor-pointer flex-grow py-1"
                                                                >
                                                                    {perm.label}
                                                                </label>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="outline" onClick={() => setEditingRole(null)}>Annuler</Button>
                                <Button onClick={handleSave}>
                                    <Save className="h-4 w-4 mr-2"/> Enregistrer
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
