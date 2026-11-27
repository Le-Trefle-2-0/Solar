import {headers} from "next/headers";
import prisma from "@/lib/prisma";
import {auth} from "@/lib/auth";
import {ALL_PERMISSIONS} from "@/lib/permissions";
import {documentsBlocked, isBanned, isBotAccount, STANDING_SELECT} from "@/lib/accountStanding";

/** Same key as OWNER_SETTING_KEY in the API. */
export const OWNER_SETTING_KEY = "owner_user_id";

const KNOWN = new Set(ALL_PERMISSIONS);

export async function getOwnerId(): Promise<string | null> {
    const row = await prisma.settings.findUnique({where: {key: OWNER_SETTING_KEY}});
    return row?.value || null;
}

export function splitRoles(role: string | null | undefined): string[] {
    return (role || "").split(",").map(r => r.trim()).filter(Boolean);
}

/** Same resolution as getActor in the API: union of the roles' permissions; the owner holds them all. */
export async function getRolePermissions(role: string | null | undefined, userId?: string): Promise<string[]> {
    if (userId && userId === await getOwnerId()) return [...ALL_PERMISSIONS];
    const names = splitRoles(role);
    if (!names.length) return [];
    const roles = await prisma.role.findMany({where: {name: {in: names}}, select: {permissions: true}});
    const perms = new Set<string>();
    for (const r of roles) {
        try {
            const parsed = JSON.parse(r.permissions || "[]");
            if (Array.isArray(parsed)) parsed.filter(p => KNOWN.has(p)).forEach(p => perms.add(p));
        } catch {
            // Malformed role permissions grant nothing
        }
    }
    return Array.from(perms);
}

export function can(permissions: string[], permission: string): boolean {
    return permissions.includes("admin.sudo") || permissions.includes(permission);
}

export interface Access {
    userId: string;
    role: string | null;
    roles: string[];
    permissions: string[];
    isOwner: boolean;
}

/**
 * The signed-in user's access, or null without a session. Server components and actions only.
 * Null as well for a banned or closed account, and for one whose identity documents are missing
 * or refused unless it may manage accounts: same rule as the API (#247, #249). Roles and status
 * are read from the database, not from the session cookie, which may be older.
 */
export async function getAccess(): Promise<Access | null> {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) return null;
    const user = await prisma.user.findUnique({
        where: {id: session.user.id},
        select: {id: true, role: true, ...STANDING_SELECT},
    });
    if (!user || isBanned(user)) return null;
    const role = user.role ?? null;
    const ownerId = await getOwnerId();
    const isOwner = ownerId === user.id;
    const permissions = isOwner ? [...ALL_PERMISSIONS] : await getRolePermissions(role);
    if (!isOwner && documentsBlocked(user) && !isBotAccount(user.id) && !can(permissions, "management.manage_accounts")) {
        return null;
    }
    return {userId: user.id, role, roles: splitRoles(role), permissions, isOwner};
}

/** Highest role weight of a user; +Infinity for the owner, -Infinity without any known role. */
export async function getRank(userId: string, role: string | null | undefined): Promise<number> {
    if (userId === await getOwnerId()) return Infinity;
    const names = splitRoles(role);
    if (!names.length) return -Infinity;
    const rows = await prisma.role.findMany({where: {name: {in: names}}, select: {weight: true}});
    return Math.max(-Infinity, ...rows.map(r => r.weight));
}
