import {NextResponse} from "next/server";
import {ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES} from "@/lib/security/fileAccess";
import {getViewer, storageFetch} from "@/lib/storageClient";

// Upload a document. The uploader is recorded so only they (or a reviewer) can read it back (#211).
export async function POST(req: Request) {
    const viewer = await getViewer();
    if (!viewer) return NextResponse.json({error: "unauthorized"}, {status: 401});

    const declared = Number(req.headers.get("content-length") || 0);
    if (declared > MAX_UPLOAD_BYTES + 1024 * 1024) return NextResponse.json({error: "too_large"}, {status: 413});

    let file: FormDataEntryValue | null;
    try {
        file = (await req.formData()).get("file");
    } catch {
        return NextResponse.json({error: "invalid_body"}, {status: 400});
    }
    if (!(file instanceof File)) return NextResponse.json({error: "no_file"}, {status: 400});
    if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({error: "too_large"}, {status: 413});
    if (!ALLOWED_UPLOAD_TYPES.has(file.type)) return NextResponse.json({error: "unsupported_type"}, {status: 415});

    const forward = new FormData();
    forward.append("file", file, file.name);
    try {
        const res = await storageFetch("/v1/files", {
            method: "POST",
            body: forward,
            headers: {"x-uploaded-by": viewer.userId},
        });
        if (!res.ok) {
            console.error("[files] storage upload failed:", res.status, await res.text());
            return NextResponse.json({error: "upload_failed"}, {status: res.status === 415 || res.status === 413 ? res.status : 502});
        }
        const {id} = await res.json();
        return NextResponse.json({id});
    } catch (e) {
        console.error("[files] storage unreachable:", e);
        return NextResponse.json({error: "upload_failed"}, {status: 502});
    }
}
