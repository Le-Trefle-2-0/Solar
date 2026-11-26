import {DEFAULT_ROLE, isKnownPermission} from './permissionCatalogue.js';

/**
 * Role hierarchy rules, modelled on Discord:
 * - the owner sits above every role and cannot be managed by anyone else;
 * - everyone else ranks at the weight of their highest role;
 * - you can only create, edit, delete, reorder or hand out roles strictly below your rank,
 *   and only manage users strictly below your rank (or yourself);
 * - you can only grant or remove permissions you hold yourself.
 * admin.sudo gives every permission but does not lift the hierarchy.
 */

export interface KnownRole {
    id?: string;
    name: string;
    weight: number;
    permissions?: string[];
}

export interface Actor {
    id: string;
    isOwner: boolean;
    roles: string[];
    permissions: string[];
}

export type Refusal = {status: 400 | 403 | 409; message: string};

export const splitRoles = (roles: string | null | undefined) =>
    (roles || '').split(',').map(r => r.trim()).filter(Boolean);

export function hasPermission(permissions: string[], permission: string): boolean {
    return permissions.includes('admin.sudo') || permissions.includes(permission);
}

/** Owner: +Infinity. Otherwise the weight of the highest known role, -Infinity without one. */
export function rankOf(isOwner: boolean, roles: string[], knownRoles: KnownRole[]): number {
    if (isOwner) return Infinity;
    const weights = new Map(knownRoles.map(r => [r.name, r.weight]));
    return Math.max(-Infinity, ...roles.flatMap(r => weights.has(r) ? [weights.get(r)!] : []));
}

/** Role names that would be stored or read back as something else. */
export function isValidRoleName(name: unknown): name is string {
    return typeof name === 'string' && name.length > 0 && name.length <= 64
        && name === name.trim() && !name.includes(',');
}

const forbidden = (message: string): Refusal => ({status: 403, message: `forbidden: ${message}`});
const invalid = (message: string): Refusal => ({status: 400, message});

export interface RoleAssignment {
    actor: Actor;
    target: {id: string; isOwner: boolean; roles: string[]};
    requested: unknown;
    knownRoles: KnownRole[];
}

/** Returns why replacing the target's roles must be refused, or null if it is allowed. */
export function checkRoleAssignment({actor, target, requested, knownRoles}: RoleAssignment): Refusal | null {
    const weights = new Map(knownRoles.map(r => [r.name, r.weight]));
    // An empty role is read by Better Auth as its default role.
    if (!Array.isArray(requested) || requested.length === 0) return invalid('Invalid roles');
    // Roles are stored comma-joined, so only exact existing names may be written.
    if (!requested.every((r): r is string => isValidRoleName(r) && weights.has(r))) return invalid('Invalid roles');
    if (new Set(requested).size !== requested.length) return invalid('Invalid roles');

    const isSelf = actor.id === target.id;
    if (target.isOwner && !isSelf) return forbidden('the owner cannot be managed');

    const rank = rankOf(actor.isOwner, actor.roles, knownRoles);
    if (!isSelf && rankOf(target.isOwner, target.roles, knownRoles) >= rank) {
        return forbidden('cannot manage users of equal or higher rank');
    }

    const before = new Set(target.roles);
    const after = new Set(requested);
    const changed = [...after].filter(r => !before.has(r)).concat([...before].filter(r => !after.has(r)));
    // Stale names (role since deleted) have no weight and may always be dropped.
    if (changed.some(r => weights.has(r) && weights.get(r)! >= rank)) {
        return forbidden('cannot assign or remove roles of equal or higher rank');
    }
    return null;
}

export interface RoleEdit {
    actor: Actor;
    knownRoles: KnownRole[];
    /** The role as stored, when an existing role is edited. */
    existing: KnownRole | null;
    requested: {name: unknown; weight: unknown; permissions: unknown};
    /** Another role already uses the requested name. */
    nameTaken: boolean;
}

/** Returns why creating or updating a role must be refused, or null if it is allowed. */
export function checkRoleEdit({actor, knownRoles, existing, requested, nameTaken}: RoleEdit): Refusal | null {
    const {name, weight, permissions} = requested;
    if (!isValidRoleName(name)) return invalid('Invalid role name');
    if (typeof weight !== 'number' || !Number.isInteger(weight)) return invalid('Invalid weight');
    if (!Array.isArray(permissions) || !permissions.every(isKnownPermission) || new Set(permissions).size !== permissions.length) {
        return invalid('Invalid permissions');
    }
    if (nameTaken) return {status: 409, message: 'A role with this name already exists'};

    const editingDefault = existing?.name === DEFAULT_ROLE;
    if (editingDefault && name !== DEFAULT_ROLE) return invalid('The default role cannot be renamed');
    if (!editingDefault && name === DEFAULT_ROLE) return invalid('This role name is reserved');
    // Users fall back to the default role, so it must never grant anything.
    if ((editingDefault || name === DEFAULT_ROLE) && permissions.length > 0) {
        return invalid('The default role cannot have permissions');
    }

    if (!hasPermission(actor.permissions, 'roles.manage')) return forbidden('roles.manage required');
    const rank = rankOf(actor.isOwner, actor.roles, knownRoles);
    if (existing && existing.weight >= rank) return forbidden('cannot manage roles of equal or higher rank');
    if (weight >= rank) return forbidden('cannot place a role at or above your own rank');

    const before = new Set<string>(existing?.permissions ?? []);
    const after = new Set<string>(permissions);
    const changed = [...after].filter(p => !before.has(p)).concat([...before].filter(p => !after.has(p)));
    if (changed.some(p => !hasPermission(actor.permissions, p))) {
        return forbidden('cannot grant or remove permissions you do not have');
    }
    return null;
}

export function checkRoleDelete(actor: Actor, role: KnownRole, knownRoles: KnownRole[]): Refusal | null {
    if (role.name === DEFAULT_ROLE) return invalid('The default role cannot be deleted');
    if (!hasPermission(actor.permissions, 'roles.manage')) return forbidden('roles.manage required');
    if (role.weight >= rankOf(actor.isOwner, actor.roles, knownRoles)) {
        return forbidden('cannot manage roles of equal or higher rank');
    }
    return null;
}

/**
 * New weights for a reordering of every role below the actor's rank (highest first).
 * The weights already used by those roles are reused, so nothing moves above the actor
 * or past a role they cannot manage; ties are broken by stepping down by one.
 */
export function planReorder(actor: Actor, knownRoles: KnownRole[], orderedIds: unknown)
    : {refusal: Refusal} | {updates: {id: string; weight: number}[]} {
    if (!hasPermission(actor.permissions, 'roles.manage')) return {refusal: forbidden('roles.manage required')};
    const rank = rankOf(actor.isOwner, actor.roles, knownRoles);
    const manageable = knownRoles.filter(r => r.id && r.weight < rank && r.name !== DEFAULT_ROLE);

    if (!Array.isArray(orderedIds) || !orderedIds.every(id => typeof id === 'string')
        || new Set(orderedIds).size !== orderedIds.length) {
        return {refusal: invalid('Invalid order')};
    }
    // The default role is hidden from the roles page and always stays where it is
    const byId = new Map(knownRoles.filter(r => r.id && r.name !== DEFAULT_ROLE).map(r => [r.id!, r]));
    if (orderedIds.some(id => !byId.has(id))) return {refusal: invalid('Unknown role')};
    if (orderedIds.some(id => byId.get(id)!.weight >= rank)) {
        return {refusal: forbidden('cannot manage roles of equal or higher rank')};
    }
    if (orderedIds.length !== manageable.length) return {refusal: invalid('Every role below your rank must be listed')};

    const pool = manageable.map(r => r.weight).sort((a, b) => b - a);
    const updates: {id: string; weight: number}[] = [];
    let previous = Infinity;
    orderedIds.forEach((id, i) => {
        const weight = Math.min(pool[i], previous - 1);
        updates.push({id, weight});
        previous = weight;
    });
    return {updates};
}

/**
 * The default role is never shown or picked: an empty selection means "no access" and is stored
 * as the default role, and the default role is dropped as soon as another role is chosen.
 * Anything that is not an array is returned untouched (and refused by checkRoleAssignment).
 */
export function withDefaultRole(requested: unknown): unknown {
    if (!Array.isArray(requested)) return requested;
    const others = requested.filter(r => r !== DEFAULT_ROLE);
    return others.length ? others : [DEFAULT_ROLE];
}

/** Replaces or removes a role name inside every comma-joined role string. Empty results become the default role. */
export function renameInRoleString(roles: string | null, from: string, to: string | null): string {
    const next = splitRoles(roles).flatMap(r => r === from ? (to ? [to] : []) : [r]);
    return [...new Set(next)].join(',') || DEFAULT_ROLE;
}
