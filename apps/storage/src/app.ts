import Fastify, {type FastifyInstance} from 'fastify';
import multipart from '@fastify/multipart';
import {lookup as mimeLookup} from 'mime-types';
import {safeEqual} from './safeEqual.js';

export interface StoredFile {
    id: string;
    filename: string;
    content: Uint8Array;
    mime: string;
    size: number;
    createdAt: Date;
    uploadedById: string | null;
}

export type FileMeta = Omit<StoredFile, 'content'>;

export interface StorageDeps {
    /** Shared with the web app only. Every route requires it (#211). */
    secret: string;
    create: (data: Omit<StoredFile, 'id' | 'createdAt'>) => Promise<FileMeta>;
    findMeta: (id: string) => Promise<FileMeta | null>;
    find: (id: string) => Promise<StoredFile | null>;
    remove: (id: string) => Promise<boolean>;
}

/** Only these are stored: identity documents are images or PDFs. */
export const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * The declared type must match the file's first bytes (#253): an HTML page or a script sent as
 * "image/png" is refused, whatever its name or Content-Type.
 */
export function contentMatchesType(mime: string, content: Buffer): boolean {
    const starts = (bytes: number[], offset = 0) => bytes.every((b, i) => content[offset + i] === b);
    switch (mime) {
        case 'application/pdf':
            return starts([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
        case 'image/png':
            return starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        case 'image/jpeg':
            return starts([0xff, 0xd8, 0xff]);
        case 'image/webp':
            return starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8); // RIFF....WEBP
        default:
            return false;
    }
}

/**
 * Served files never run anything: images in a sandbox with nothing to load; PDFs without
 * sandbox (browsers' PDF viewers refuse to open in one), but with nothing else allowed (#253).
 */
export function fileContentSecurityPolicy(mime: string): string {
    return mime === 'application/pdf'
        ? "default-src 'none'; object-src 'self'; frame-ancestors 'self'"
        : "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox; frame-ancestors 'self'";
}

const toMeta = (f: FileMeta) => ({
    id: f.id,
    filename: f.filename,
    size: f.size,
    mime: f.mime,
    createdAt: f.createdAt.toISOString(),
    uploadedById: f.uploadedById,
});

export async function buildApp(deps: StorageDeps, opts: {logger?: boolean} = {}): Promise<FastifyInstance> {
    if (!deps.secret) throw new Error('STORAGE_SECRET is required');

    const app = Fastify({logger: opts.logger ?? false, bodyLimit: MAX_FILE_SIZE + 1024 * 1024});
    // No CORS: browsers never call this service, the web app proxies with access control.
    await app.register(multipart, {limits: {fileSize: MAX_FILE_SIZE, files: 1}});

    app.addHook('onRequest', async (req, reply) => {
        const header = req.headers.authorization;
        const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : '';
        if (!safeEqual(token, deps.secret)) {
            return reply.code(401).send({error: 'unauthorized'});
        }
    });

    app.post('/v1/files', async (req, reply) => {
        const uploadedBy = req.headers['x-uploaded-by'];
        if (typeof uploadedBy !== 'string' || !uploadedBy) return reply.code(400).send({error: 'missing_uploader'});

        const mp = await req.file();
        if (!mp) return reply.code(400).send({error: 'no_file'});

        const filename = (mp.filename || 'upload.bin').slice(0, 255);
        const mime = String(mp.mimetype || mimeLookup(filename) || 'application/octet-stream');
        if (!ALLOWED_MIME.has(mime)) return reply.code(415).send({error: 'unsupported_type'});

        const buffer = await mp.toBuffer();
        if (mp.file.truncated) return reply.code(413).send({error: 'too_large'});
        if (!contentMatchesType(mime, buffer)) return reply.code(415).send({error: 'content_mismatch'});

        const file = await deps.create({filename, content: buffer, mime, size: buffer.length, uploadedById: uploadedBy});
        return {id: file.id, meta: toMeta(file)};
    });

    app.get('/v1/files/:id/meta', async (req, reply) => {
        const {id} = req.params as {id: string};
        const file = await deps.findMeta(id);
        if (!file) return reply.code(404).send({error: 'not_found'});
        return toMeta(file);
    });

    app.get('/v1/files/:id', async (req, reply) => {
        const {id} = req.params as {id: string};
        const file = await deps.find(id);
        if (!file) return reply.code(404).send({error: 'not_found'});

        reply.header('content-type', file.mime || 'application/octet-stream');
        reply.header('content-length', file.size);
        reply.header('x-content-type-options', 'nosniff');
        reply.header('content-security-policy', fileContentSecurityPolicy(file.mime));
        reply.header('content-disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
        return reply.send(Buffer.from(file.content));
    });

    app.delete('/v1/files/:id', async (req, reply) => {
        const {id} = req.params as {id: string};
        if (!(await deps.remove(id))) return reply.code(404).send({error: 'not_found'});
        return {ok: true};
    });

    return app;
}
