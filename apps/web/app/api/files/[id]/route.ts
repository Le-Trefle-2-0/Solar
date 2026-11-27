import {NextResponse} from "next/server";
import {canDeleteFile, canReadFile, fileResponseHeaders, isFileId} from "@/lib/security/fileAccess";
import {getFileMeta, getFileOwnership, getViewer, storageFetch} from "@/lib/storageClient";

type Ctx = {params: Promise<{id: string}>};

// 404 rather than 403 so ids of other people's documents cannot be confirmed.
const notFound = () => NextResponse.json({error: "not_found"}, {status: 404});

export async function GET(_req: Request, {params}: Ctx) {
    const viewer = await getViewer();
    if (!viewer) return NextResponse.json({error: "unauthorized"}, {status: 401});
    const {id} = await params;
    // Only a file id (UUID) reaches the storage service (#254)
    if (!isFileId(id)) return notFound();

    try {
        const meta = await getFileMeta(id);
        if (!meta || !canReadFile(viewer, await getFileOwnership(meta))) return notFound();

        const res = await storageFetch(`/v1/files/${encodeURIComponent(id)}`);
        if (!res.ok || !res.body) return notFound();
        return new Response(res.body, {headers: fileResponseHeaders(meta.mime, meta.filename, meta.size)});
    } catch (e) {
        console.error("[files] read failed:", e);
        return NextResponse.json({error: "unavailable"}, {status: 502});
    }
}

export async function DELETE(_req: Request, {params}: Ctx) {
    const viewer = await getViewer();
    if (!viewer) return NextResponse.json({error: "unauthorized"}, {status: 401});
    if (!canDeleteFile(viewer)) return NextResponse.json({error: "forbidden"}, {status: 403});
    const {id} = await params;
    if (!isFileId(id)) return notFound();

    try {
        const res = await storageFetch(`/v1/files/${encodeURIComponent(id)}`, {method: "DELETE"});
        if (res.status === 404) return notFound();
        if (!res.ok) return NextResponse.json({error: "delete_failed"}, {status: 502});
        return NextResponse.json({ok: true});
    } catch (e) {
        console.error("[files] delete failed:", e);
        return NextResponse.json({error: "unavailable"}, {status: 502});
    }
}
