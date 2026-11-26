"use client";

import {apiFetch} from "@/lib/api";
import {useEffect, useRef, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import * as Icons from "lucide-react";
import {Crown, GripVertical, Lock, Plus, RotateCcw, Shield, Trash2} from "lucide-react";
import {IconPicker} from "@/components/ui/icon-picker";
import {ALL_PERMISSIONS, PERMISSION_METADATA} from "@/lib/permissions";
import {toast} from "sonner";

interface Role {
    id: string;
    name: string;
    permissions: string; // JSON
    weight: number;
    icon?: string;
}

interface Me {
    isOwner: boolean;
    /** Weight of the caller's highest role; null for the owner or without any role. */
    rank: number | null;
    permissions: string[];
}

/** The default role: always present, no permission, cannot be renamed or deleted. */
const DEFAULT_ROLE = "none";

// Grouped by the categories of the permission catalogue (Better Auth's own statements are not role permissions)
const CATEGORIZED_PERMISSIONS = ALL_PERMISSIONS.reduce((acc, id) => {
    const meta = PERMISSION_METADATA[id];
    (acc[meta.category] ??= []).push({id, label: meta.label, description: meta.description});
    return acc;
}, {} as Record<string, { id: string, label: string, description: string }[]>);

const parsePerms = (json?: string): string[] => {
    try {
        const parsed = JSON.parse(json || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export function RolesManager() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [me, setMe] = useState<Me | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    // Same rules as the API (roleAssignment.ts): roles strictly below your rank, permissions you hold.
    const canManage = (role: Partial<Role> | null | undefined) =>
        !!me && !!role && (me.isOwner || (me.rank !== null && (role.weight ?? 0) < me.rank));
    const holds = (perm: string) => !!me && (me.permissions.includes("admin.sudo") || me.permissions.includes(perm));
    const canEditRoles = holds("roles.manage");

    const fetchRoles = async (keepSelection = true) => {
        try {
            const res = await apiFetch("/v1/admin/roles");
            if (res.roles) {
                const sortedRoles: Role[] = [...res.roles].sort((a, b) => b.weight - a.weight);
                setRoles(sortedRoles);
                setMe(res.me ?? null);
                setEditingRole(prev => {
                    if (keepSelection && prev?.id) {
                        return sortedRoles.find(r => r.id === prev.id) ?? sortedRoles[sortedRoles.length - 1] ?? null;
                    }
                    return sortedRoles[sortedRoles.length - 1] ?? null;
                });
            }
        } catch {
            toast.error("Erreur lors de la récupération des rôles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles(false);
    }, []);

    const handleSave = async (role: Partial<Role>) => {
        if (!role?.name) return;
        try {
            const res = await apiFetch("/v1/admin/roles", {
                method: "POST",
                body: JSON.stringify({
                    id: (role.id?.startsWith("new-") ? undefined : role.id),
                    name: role.name,
                    permissions: role.permissions || "[]",
                    weight: role.weight ?? 0,
                    icon: role.icon
                })
            });

            if (role.id?.startsWith("new-") && res.role?.id) {
                setEditingRole(prev => prev ? {...prev, id: res.role.id} : null);
                setRoles(prev => prev.map(r => r.id === role.id ? res.role : r));
            }
        } catch (error: any) {
            // The API refused (hierarchy, permission not held, duplicate name...): show why and reload the truth
            toast.error(error.message || "Erreur lors de l'enregistrement");
            if (!role.id?.startsWith("new-")) fetchRoles();
        }
    };

    const updateRolesOrder = async (newRoles: Role[]) => {
        // Only the roles below your rank can move; their existing weights are redistributed by the API
        const ids = newRoles.filter(r => canManage(r)).map(r => r.id).filter(id => !id.startsWith("new-"));
        try {
            await apiFetch("/v1/admin/roles/reorder", {method: "POST", body: JSON.stringify({ids})});
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la mise à jour de l'ordre");
        }
        fetchRoles();
    };

    const onDragStart = (e: React.DragEvent, index: number) => {
        if (!canEditRoles || !canManage(roles[index])) {
            e.preventDefault();
            return;
        }
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        // Never drop above or among roles you cannot manage
        if (draggedIndex === null || draggedIndex === index || !canManage(roles[index])) return;

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
        if (!confirm("Supprimer ce rôle ? Les membres qui l'ont le perdront.")) return;
        if (id.startsWith("new-")) {
            setRoles(prev => prev.filter(r => r.id !== id));
            setEditingRole(null);
            return;
        }
        try {
            await apiFetch(`/v1/admin/roles/${id}`, {method: "DELETE"});
            toast.success("Rôle supprimé");
            fetchRoles(false);
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la suppression");
        }
    };

    const handleReset = async () => {
        if (!confirm(
            "Rétablir la configuration par défaut des rôles ?\n\n" +
            "Les rôles par défaut retrouvent leur nom, leur ordre, leur icône et leurs permissions. " +
            "Tous les autres rôles sont supprimés et retirés de leurs membres. " +
            "Les membres gardent les rôles par défaut qu'ils ont déjà."
        )) return;
        try {
            await apiFetch("/v1/admin/roles/reset", {method: "POST"});
            toast.success("Rôles réinitialisés");
            fetchRoles(false);
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la réinitialisation");
        }
    };

    const togglePermission = (permId: string) => {
        if (!editingRole) return;
        const currentPerms = parsePerms(editingRole.permissions);
        const newPerms = currentPerms.includes(permId)
            ? currentPerms.filter(p => p !== permId)
            : [...currentPerms, permId];
        const updatedRole = {...editingRole, permissions: JSON.stringify(newPerms)};
        setEditingRole(updatedRole);
        setRoles(prev => prev.map(r => r.id === editingRole.id ? {...r, permissions: updatedRole.permissions} : r));
        handleSave(updatedRole);
    };

    const handleNameChange = (name: string) => {
        if (!editingRole) return;
        const updatedRole = {...editingRole, name};
        setEditingRole(updatedRole);
        setRoles(prev => prev.map(r => r.id === editingRole.id ? {...r, name} : r));

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            handleSave(updatedRole);
        }, 1000);
    };

    const handleIconChange = (icon: string) => {
        if (!editingRole) return;
        const updatedRole = {...editingRole, icon};
        setEditingRole(updatedRole);
        setRoles(prev => prev.map(r => r.id === editingRole.id ? {...r, icon} : r));
        handleSave(updatedRole);
    };

    const createRole = () => {
        if (!me) return;
        // New roles go just below the creator (owner: on top)
        const top = roles.length ? Math.max(...roles.map(r => r.weight)) : 0;
        const weight = me.isOwner || me.rank === null ? top + 10 : me.rank - 1;
        let name = "nouveau rôle";
        for (let i = 2; roles.some(r => r.name === name); i++) name = `nouveau rôle ${i}`;
        const newRole: Role = {id: "new-" + Date.now(), name, permissions: "[]", weight, icon: "Shield"};
        setRoles(prev => [...prev, newRole].sort((a, b) => b.weight - a.weight));
        setEditingRole(newRole);
        handleSave(newRole);
    };

    const renderRoleIcon = (role: Role) => {
        const Icon = (Icons as any)[role.icon || "Shield"] || Shield;
        return <Icon className={`h-4 w-4 ${canManage(role) ? 'text-primary' : 'text-muted-foreground'}`}/>;
    };

    if (loading) return <div>Chargement...</div>;

    const editable = canEditRoles && canManage(editingRole);
    const isDefault = editingRole?.name === DEFAULT_ROLE && !editingRole?.id?.startsWith("new-");
    const editingPerms = parsePerms(editingRole?.permissions);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Rôles</CardTitle>
                        <div className="flex items-center gap-2">
                            {me?.isOwner && (
                                <Button size="sm" variant="outline" onClick={handleReset}
                                        title="Rétablir les rôles par défaut">
                                    <RotateCcw className="h-4 w-4 mr-2"/> Réinitialiser
                                </Button>
                            )}
                            {canEditRoles && (
                                <Button size="sm" onClick={createRole}>
                                    <Plus className="h-4 w-4 mr-2"/> Nouveau
                                </Button>
                            )}
                        </div>
                    </div>
                    <CardDescription>
                        Du plus haut au plus bas. Vous pouvez modifier, déplacer et supprimer les rôles placés
                        sous votre rôle le plus haut.
                    </CardDescription>
                    {me?.isOwner && (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                            <Crown className="h-3.5 w-3.5 text-amber-500"/>
                            Propriétaire : vous êtes au-dessus de tous les rôles.
                        </p>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {roles.map((role, index) => {
                            const manageable = canEditRoles && canManage(role);
                            return (
                                <div
                                    key={role.id}
                                    draggable={manageable}
                                    onDragStart={(e) => onDragStart(e, index)}
                                    onDragOver={(e) => onDragOver(e, index)}
                                    onDragEnd={onDragEnd}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none ${editingRole?.id === role.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted'} ${draggedIndex === index ? 'opacity-40 border-primary border-dashed' : ''}`}
                                    onClick={() => setEditingRole({...role})}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={manageable ? "cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-primary transition-colors" : "text-muted-foreground/40"}
                                            title={manageable ? "Déplacer" : "Rôle égal ou supérieur au vôtre"}>
                                            {manageable ? <GripVertical className="h-4 w-4"/> : <Lock className="h-4 w-4"/>}
                                        </div>
                                        {renderRoleIcon(role)}
                                        <div>
                                            <p className="font-medium text-sm">{role.name}</p>
                                        </div>
                                    </div>
                                    {manageable && role.name !== DEFAULT_ROLE && (
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(role.id);
                                                    }}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>{editable ? "Modifier le rôle" : "Détails du rôle"}</CardTitle>
                    <CardDescription>
                        {!editingRole ? "Configurez le nom, la hiérarchie et les permissions."
                            : !editable ? "Ce rôle est égal ou supérieur au vôtre : lecture seule."
                                : isDefault ? "Rôle par défaut des membres sans autre rôle : il ne peut avoir aucune permission."
                                    : "Vous ne pouvez donner ou retirer que des permissions que vous possédez."}
                    </CardDescription>
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
                                        disabled={!editable || isDefault}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Icône</Label>
                                    <div className={editable ? "" : "pointer-events-none opacity-60"}>
                                        <IconPicker
                                            value={editingRole.icon || "Shield"}
                                            onChange={(icon) => handleIconChange(icon)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-base font-bold">Permissions</Label>
                                <div className="space-y-8">
                                    {Object.entries(CATEGORIZED_PERMISSIONS).map(([category, perms]) => (
                                        <div key={category} className="space-y-4">
                                            <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">{category}</h4>
                                            <div className="space-y-2">
                                                {perms.map((perm) => {
                                                    const isChecked = editingPerms.includes(perm.id);
                                                    const locked = !editable || isDefault || !holds(perm.id);
                                                    return (
                                                        <div key={perm.id}
                                                             className={`flex items-start justify-between p-3 rounded-lg border bg-card/50 transition-colors gap-4 ${locked ? 'opacity-60' : 'hover:bg-muted/50'}`}>
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
                                                                {editable && !isDefault && !holds(perm.id) && (
                                                                    <p className="text-xs text-muted-foreground italic">
                                                                        Vous ne possédez pas cette permission.
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <Switch
                                                                id={perm.id}
                                                                checked={isChecked}
                                                                disabled={locked}
                                                                onCheckedChange={() => togglePermission(perm.id)}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
