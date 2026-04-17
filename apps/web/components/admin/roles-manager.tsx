"use client";

import {apiFetch} from "@/lib/api";
import {useEffect, useRef, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import * as Icons from "lucide-react";
import {GripVertical, Plus, Shield, Trash2} from "lucide-react";
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
                label: meta?.label || `${catName}: ${p}`,
                description: meta?.description || ""
            };
        });
    }
    return acc;
}, {} as Record<string, { id: string, label: string, description: string }[]>);

export function RolesManager() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const fetchRoles = async () => {
        try {
            const res = await apiFetch("/v1/admin/roles");
            if (res.roles) {
                // Sort by weight descending
                const sortedRoles = [...res.roles].sort((a, b) => b.weight - a.weight);
                setRoles(sortedRoles);

                // Select the lowest role by default on initial load
                if (sortedRoles.length > 0 && !editingRole) {
                    setEditingRole(sortedRoles[sortedRoles.length - 1]);
                }
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

    const handleSave = async (roleToSave?: Partial<Role>, isAutoSave = false) => {
        const role = roleToSave || editingRole;
        if (!role?.name) return; // Silent return for auto-save if name is missing

        try {
            const res = await apiFetch("/v1/admin/roles", {
                method: "POST",
                body: JSON.stringify({
                    id: (role.id?.startsWith("new-") ? undefined : role.id),
                    name: role.name,
                    permissions: role.permissions || "[]",
                    weight: role.weight || 0,
                    icon: role.icon
                })
            });

            // If it's a new role, the backend should return the new role with its ID
            if (role.id?.startsWith("new-") && res.role?.id) {
                setEditingRole(prev => prev ? {...prev, id: res.role.id} : null);
                setRoles(prev => prev.map(r => r.id === role.id ? res.role : r));
            }

            if (!isAutoSave) {
                toast.success("Rôle enregistré avec succès");
                setEditingRole(null);
            }
            if (!role.id?.startsWith("new-")) fetchRoles();
        } catch (error: any) {
            if (!isAutoSave) toast.error(error.message || "Erreur lors de l'enregistrement");
        }
    };

    const updateRolesOrder = async (newRoles: Role[]) => {
        // Update weights based on index (highest weight at index 0)
        const updatedRoles = newRoles.map((role, index) => ({
            ...role,
            weight: (newRoles.length - index) * 10
        }));

        setRoles(updatedRoles);

        // Persist weights for all roles
        try {
            await Promise.all(updatedRoles.map(role =>
                apiFetch("/v1/admin/roles", {
                    method: "POST",
                    body: JSON.stringify({
                        id: role.id,
                        name: role.name,
                        permissions: role.permissions,
                        weight: role.weight,
                        icon: role.icon
                    })
                })
            ));
            // toast.success("Ordre des rôles mis à jour");
        } catch (error) {
            toast.error("Erreur lors de la mise à jour de l'ordre");
        }
    };

    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newRoles = [...roles];
        const [movedRole] = newRoles.splice(draggedIndex, 1);
        newRoles.splice(index, 0, movedRole);
        setDraggedIndex(index);
        setRoles(newRoles);
    };

    const onDragEnd = () => {
        if (draggedIndex !== null) {
            updateRolesOrder(roles);
        }
        setDraggedIndex(null);
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
        const updatedRole = {...editingRole, permissions: JSON.stringify(newPerms)};
        setEditingRole(updatedRole);
        handleSave(updatedRole, true);
    };

    const handleNameChange = (name: string) => {
        if (!editingRole) return;
        const updatedRole = {...editingRole, name};
        setEditingRole(updatedRole);

        // Update the role name in the list immediately
        setRoles(prev => prev.map(r => r.id === editingRole.id ? {...r, name} : r));

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            handleSave(updatedRole, true);
        }, 1000);
    };

    const handleIconChange = (icon: string) => {
        if (!editingRole) return;
        const updatedRole = {...editingRole, icon};
        setEditingRole(updatedRole);

        // Update the icon in the list immediately
        setRoles(prev => prev.map(r => r.id === editingRole.id ? {...r, icon} : r));

        handleSave(updatedRole, true);
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
                        <Button size="sm" onClick={() => {
                            const newRole: Partial<Role> = {
                                id: "new-" + Date.now(),
                                name: "nouveau rôle",
                                permissions: "[]",
                                weight: 0,
                                icon: "Shield"
                            };
                            setRoles(prev => [...prev, newRole as Role]);
                            setEditingRole(newRole);
                        }}>
                            <Plus className="h-4 w-4 mr-2"/> Nouveau
                        </Button>
                    </div>
                    <CardDescription>Hiérarchie des rôles (poids décroissant)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {roles.map((role, index) => (
                        <div
                            key={role.id}
                            draggable
                            onDragStart={(e) => onDragStart(e, index)}
                            onDragOver={(e) => onDragOver(e, index)}
                            onDragEnd={onDragEnd}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none ${editingRole?.id === role.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted'} ${draggedIndex === index ? 'opacity-40 border-primary border-dashed' : ''}`}
                            onClick={() => setEditingRole({...role})}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-primary transition-colors">
                                    <GripVertical className="h-4 w-4"/>
                                </div>
                                {renderRoleIcon(role)}
                                <div>
                                    <p className="font-medium text-sm">{role.name}</p>
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
                                        value={editingRole.name || ""}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        placeholder="ex: Modérateur"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Icône</Label>
                                    <IconPicker
                                        value={editingRole.icon || "Shield"}
                                        onChange={(icon) => handleIconChange(icon)}
                                    />
                                </div>
                            </div>

                            <Separator/>

                            <div className="space-y-4">
                                <Label className="text-base font-bold">Permissions</Label>
                                <ScrollArea className="h-[450px] pr-4">
                                    <div className="space-y-8">
                                        {Object.entries(CATEGORIZED_PERMISSIONS).map(([category, perms]) => (
                                            <div key={category} className="space-y-4">
                                                <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">{category}</h4>
                                                <div className="space-y-2">
                                                    {perms.map((perm) => {
                                                        const isChecked = JSON.parse(editingRole.permissions || "[]").includes(perm.id);
                                                        return (
                                                            <div key={perm.id}
                                                                 className="flex items-start justify-between p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors gap-4">
                                                                <div className="space-y-0.5">
                                                                    <Label
                                                                        htmlFor={perm.id}
                                                                        className="text-sm font-semibold cursor-pointer"
                                                                    >
                                                                        {perm.label}
                                                                    </Label>
                                                                    {perm.description && (
                                                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                                                            {perm.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <Switch
                                                                    id={perm.id}
                                                                    checked={isChecked}
                                                                    onCheckedChange={() => togglePermission(perm.id)}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <div className="flex justify-between items-center gap-3 pt-4 border-t">
                                <Button variant="outline" onClick={() => setEditingRole(null)}>Fermer</Button>
                                <p className="text-xs text-muted-foreground italic">Enregistrement automatique
                                    activé</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
