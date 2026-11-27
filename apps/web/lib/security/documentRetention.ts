import prisma from "../prisma";

/**
 * Identity documents are kept only while they are the current ones (#272): a replaced, renewed
 * or removed document is deleted from storage, and so are uploads never attached to a profile
 * (left after an abandoned submission) once they are a day old.
 */

export const ORPHAN_UPLOAD_AGE_MS = 24 * 60 * 60 * 1000;

/** Pure part: which of these uploads may go. */
export function documentsToDelete(
    uploads: { id: string; createdAt: Date }[],
    current: Set<string>,
    released: Set<string>,
    now = Date.now(),
): string[] {
    return uploads
        .filter(f => !current.has(f.id) && (released.has(f.id) || now - f.createdAt.getTime() > ORPHAN_UPLOAD_AGE_MS))
        .map(f => f.id);
}

/**
 * Deletes the documents of these users that are no longer attached: `released` are the ids
 * that were attached until now (replaced or reset), deleted whatever their age.
 */
export async function purgeDocuments(userIds: string[], released: (string | null | undefined)[] = []) {
    if (userIds.length === 0) return 0;
    const [uploads, attached] = await Promise.all([
        prisma.file.findMany({where: {uploadedById: {in: userIds}}, select: {id: true, createdAt: true}}),
        prisma.user.findMany({where: {id: {in: userIds}}, select: {idCardFileId: true, casierFileId: true}}),
    ]);
    const current = new Set(attached.flatMap(u => [u.idCardFileId, u.casierFileId]).filter((id): id is string => !!id));
    const ids = documentsToDelete(uploads, current, new Set(released.filter((id): id is string => !!id)));
    if (ids.length === 0) return 0;
    return (await prisma.file.deleteMany({where: {id: {in: ids}}})).count;
}
