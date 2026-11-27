import {NextResponse} from "next/server";
import {canReadFile, isFileId} from "@/lib/security/fileAccess";
import {getFileMeta, getFileOwnership, getViewer} from "@/lib/storageClient";

export async function GET(_req: Request, {params}: {params: Promise<{id: string}>}) {
    const viewer = await getViewer();
    if (!viewer) return NextResponse.json({error: "unauthorized"}, {status: 401});
    const {id} = await params;
    // Only a file id (UUID) reaches the storage service (#254)
    if (!isFileId(id)) return NextResponse.json({error: "not_found"}, {status: 404});

    try {
        const meta = await getFileMeta(id);
        if (!meta || !canReadFile(viewer, await getFileOwnership(meta))) {
            return NextResponse.json({error: "not_found"}, {status: 404});
        }
        const {filename, size, mime, createdAt} = meta;
        return NextResponse.json({id: meta.id, filename, size, mime, createdAt});
    } catch (e) {
        console.error("[files] meta failed:", e);
        return NextResponse.json({error: "unavailable"}, {status: 502});
    }
}
