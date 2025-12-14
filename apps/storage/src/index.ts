import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import {createReadStream, createWriteStream, existsSync, mkdirSync, promises as fsp, readFileSync, statSync} from 'fs';
import {join, resolve} from 'path';
import {fileURLToPath} from 'url';
import {lookup as mimeLookup} from 'mime-types';
import {randomUUID} from 'crypto';
import {STORAGE_HOST, STORAGE_PORT} from './env';

const app = Fastify({logger: true});

await app.register(cors, {origin: true, credentials: true});
await app.register(multipart, {limits: {fileSize: 25 * 1024 * 1024}}); // 25 MB default

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const UPLOADS_DIR = resolve(__dirname, '../../uploads');

if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, {recursive: true});
}

type StoredMeta = {
    id: string;
    filename: string;
    size: number;
    mime: string;
    createdAt: string;
    uploader?: string | null;
};

app.post('/v1/files', async (req, reply) => {
    const mp = await req.file();
    if (!mp) return reply.code(400).send({error: 'no_file'});
    const id = randomUUID();
    // Best-effort mime
    const originalName = mp.filename || 'upload.bin';
    const guessed = mimeLookup(originalName) || 'application/octet-stream';
    const tmpPath = join(UPLOADS_DIR, id);

    const ws = createWriteStream(tmpPath);
    const pump = new Promise<void>((resolve, reject) => {
        mp.file.pipe(ws);
        ws.on('finish', () => resolve());
        ws.on('error', reject);
    });
    await pump;

    const st = statSync(tmpPath);
    const meta: StoredMeta = {
        id,
        filename: originalName,
        size: st.size,
        mime: String(mp.mimetype || guessed),
        createdAt: new Date().toISOString(),
        uploader: (req.headers['x-user-id'] as string) || null,
    };
    await fsp.writeFile(join(UPLOADS_DIR, `${id}.json`), JSON.stringify(meta, null, 2), 'utf8');
    return {id, url: `/v1/files/${id}`, meta};
});

app.get('/v1/files/:id/meta', async (req, reply) => {
    const {id} = req.params as any;
    try {
        const metaPath = join(UPLOADS_DIR, `${id}.json`);
        const buf = await fsp.readFile(metaPath, 'utf8');
        const meta = JSON.parse(buf);
        return meta;
    } catch {
        return reply.code(404).send({error: 'not_found'});
    }
});

app.get('/v1/files/:id', async (req, reply) => {
    const {id} = req.params as any;
    const filePath = join(UPLOADS_DIR, id);
    const metaPath = join(UPLOADS_DIR, `${id}.json`);
    try {
        const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as StoredMeta;
        const st = statSync(filePath);
        reply.header('content-type', meta.mime || 'application/octet-stream');
        reply.header('content-length', st.size);
        reply.header('content-disposition', `inline; filename="${encodeURIComponent(meta.filename)}"`);
        return reply.send(createReadStream(filePath));
    } catch {
        return reply.code(404).send({error: 'not_found'});
    }
});

app.delete('/v1/files/:id', async (req, reply) => {
    const {id} = req.params as any;
    const filePath = join(UPLOADS_DIR, id);
    const metaPath = join(UPLOADS_DIR, `${id}.json`);
    try {
        await Promise.allSettled([fsp.unlink(filePath), fsp.unlink(metaPath)]);
        return {ok: true};
    } catch {
        return reply.code(404).send({error: 'not_found'});
    }
});

app.listen({host: STORAGE_HOST, port: STORAGE_PORT}).then(() => {
    app.log.info(`Storage service listening on http://${STORAGE_HOST}:${STORAGE_PORT}`);
});
