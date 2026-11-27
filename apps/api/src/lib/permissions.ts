import {prisma} from '../prisma.js';
import {ALL_PERMISSIONS, isKnownPermission} from './permissionCatalogue.js';
import {splitRoles, hasPermission, type Actor, type KnownRole} from './roleAssignment.js';
import {documentsBlocked, isBanned, isBotAccount, STANDING_SELECT} from './accountStanding.js';

export {hasPermission} from './roleAssignment.js';

/** Settings key holding the id of the owner account (the one created at setup). */
export const OWNER_SETTING_KEY = 'owner_user_id';

export async function getOwnerId(): Promise<string | null> {
    const setting = await prisma.settings.findUnique({where: {key: OWNER_SETTING_KEY}});
    return setting?.value || null;
}

export function parsePermissions(json: string | null | undefined, roleName = '?'): string[] {
    try {
        const parsed = JSON.parse(json || '[]');
        // Ids no longer in the catalogue (renamed or removed permissions) grant nothing
        return Array.isArray(parsed) ? [...new Set(parsed.filter(isKnownPermission))] : [];
    } catch (e) {
        console.error(`Failed to parse permissions for role ${roleName}`, e);
        return [];
    }
}

export async function getKnownRoles(): Promise<KnownRole[]> {
    const roles = await prisma.role.findMany({select: {id: true, name: true, weight: true, permissions: true}});
    return roles.map(r => ({...r, permissions: parsePermissions(r.permissions, r.name)}));
}

/**
 * Who the user is for authorization: their roles, effective permissions and owner status.
 * The owner holds every permission, whatever their roles say.
 *
 * Nobody (null) for a banned or closed account, and for an account whose identity documents are
 * missing or refused, unless it may manage accounts (#247, #249): the API, the WebSocket service
 * and the voice service then refuse it, as the app's document dialog does. The documents
 * themselves are sent through the web app, which stays reachable.
 */
export async function getActor(userId: string): Promise<Actor | null> {
    const [user, ownerId] = await Promise.all([
        prisma.user.findUnique({where: {id: userId}, select: {id: true, role: true, ...STANDING_SELECT}}),
        getOwnerId(),
    ]);
    if (!user || isBanned(user)) return null;
    const isOwner = ownerId === user.id;
    const roles = splitRoles(user.role);
    if (isOwner) return {id: user.id, isOwner, roles, permissions: [...ALL_PERMISSIONS]};

    const rows = roles.length
        ? await prisma.role.findMany({where: {name: {in: roles}}, select: {name: true, permissions: true}})
        : [];
    const permissions = new Set<string>();
    for (const row of rows) parsePermissions(row.permissions, row.name).forEach(p => permissions.add(p));
    const granted = [...permissions];
    if (documentsBlocked(user) && !isBotAccount(user.id) && !hasPermission(granted, 'management.manage_accounts')) {
        return null;
    }
    return {id: user.id, isOwner, roles, permissions: granted};
}

export async function getUserPermissions(userId: string): Promise<string[]> {
    return (await getActor(userId))?.permissions ?? [];
}
