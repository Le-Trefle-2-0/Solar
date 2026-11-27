/**
 * Who may reach a stored document through /api/files (#211).
 * The storage service itself only trusts the web app; these rules are the real access control.
 */

/** Stored files are identified by a UUID (File.id): anything else is refused before any lookup (#254). */
export const isFileId = (value: unknown): value is string =>
    typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const ALLOWED_UPLOAD_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export interface Viewer {
    userId: string;
    /** Comma-separated Better Auth roles of the viewer. */
    role: string | null | undefined;
    permissions: string[];
}

/** Same people as validateDocumentsAction: management.manage_accounts (or admin.sudo, held by the owner too). */
export function isDocumentReviewer({permissions}: Viewer): boolean {
    return permissions.includes("admin.sudo") || permissions.includes("management.manage_accounts");
}

export interface FileOwnership {
    uploadedById: string | null;
    /** Users whose idCardFileId or casierFileId points to this file. */
    linkedUserIds: string[];
}

export function canReadFile(viewer: Viewer, file: FileOwnership): boolean {
    if (file.uploadedById !== null && file.uploadedById === viewer.userId) return true;
    if (file.linkedUserIds.includes(viewer.userId)) return true;
    return isDocumentReviewer(viewer);
}

export function canDeleteFile(viewer: Viewer): boolean {
    return isDocumentReviewer(viewer);
}

/** A user may only attach to their profile a file they uploaded themself. */
export function canLinkFile(userId: string, file: {uploadedById: string | null} | null): boolean {
    return !!file && file.uploadedById !== null && file.uploadedById === userId;
}

/** Headers for a served document: no MIME sniffing, and unknown types are downloaded, never rendered. */
export function fileResponseHeaders(mime: string, filename: string, size: number): Record<string, string> {
    const safeMime = ALLOWED_UPLOAD_TYPES.has(mime) ? mime : "application/octet-stream";
    const disposition = ALLOWED_UPLOAD_TYPES.has(mime) ? "inline" : "attachment";
    return {
        "content-type": safeMime,
        "content-length": String(size),
        "content-disposition": `${disposition}; filename="${encodeURIComponent(filename)}"`,
        "x-content-type-options": "nosniff",
        "cache-control": "private, no-store",
    };
}
