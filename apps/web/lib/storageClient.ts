import {headers} from "next/headers";
import prisma from "@/lib/prisma";
import {auth} from "@/lib/auth";
import {getEffectivePermissions} from "@/lib/userPermissions";
import type {FileOwnership, Viewer} from "@/lib/security/fileAccess";

/**
 * Server-side access to the internal storage service (#211). Never import this
 * from client code: it carries STORAGE_SECRET.
 */
function storageConfig() {
    const secret = process.env.STORAGE_SECRET;
    if (!secret) throw new Error("STORAGE_SECRET is not set");
    const base = (process.env.STORAGE_INTERNAL_URL || `http://127.0.0.1:${process.env.STORAGE_PORT || 3004}`).replace(/\/$/, "");
    return {base, secret};
}

export async function storageFetch(path: string, init: RequestInit & {headers?: Record<string, string>} = {}) {
    const {base, secret} = storageConfig();
    return fetch(`${base}${path}`, {
        ...init,
        headers: {...init.headers, authorization: `Bearer ${secret}`},
        cache: "no-store",
    });
}

export interface StorageMeta {
    id: string;
    filename: string;
    size: number;
    mime: string;
    createdAt: string;
    uploadedById: string | null;
}

export async function getFileMeta(id: string): Promise<StorageMeta | null> {
    const res = await storageFetch(`/v1/files/${encodeURIComponent(id)}/meta`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`storage meta failed: ${res.status}`);
    return res.json();
}

/** The signed-in user, with what the access rules need. */
export async function getViewer(): Promise<Viewer | null> {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) return null;
    const role = (session.user as {role?: string | null}).role;
    return {userId: session.user.id, role, permissions: await getEffectivePermissions(session.user.id)};
}

export async function getFileOwnership(meta: StorageMeta): Promise<FileOwnership> {
    const linked = await prisma.user.findMany({
        where: {OR: [{idCardFileId: meta.id}, {casierFileId: meta.id}]},
        select: {id: true},
    });
    return {uploadedById: meta.uploadedById, linkedUserIds: linked.map(u => u.id)};
}
