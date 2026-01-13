import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import {lookup as mimeLookup} from 'mime-types';
import {STORAGE_HOST, STORAGE_PORT} from './env.js';
import {prisma} from './prisma.js';

const app = Fastify({
    logger: true,
    bodyLimit: 50 * 1024 * 1024 // 50MB
});

await app.register(cors, {origin: true, credentials: true});
await app.register(multipart, {limits: {fileSize: 25 * 1024 * 1024}}); // 25 MB default

app.post('/v1/files', async (req, reply) => {
    const mp = await req.file();
    if (!mp) return reply.code(400).send({error: 'no_file'});

    // Best-effort mime
    const originalName = mp.filename || 'upload.bin';
    const guessed = mimeLookup(originalName) || 'application/octet-stream';
    const mime = String(mp.mimetype || guessed);

    const buffer = await mp.toBuffer();

    const file = await prisma.file.create({
        data: {
            filename: originalName,
            content: buffer,
            mime: mime,
            size: buffer.length,
        },
    });

    return {
        id: file.id,
        url: `/v1/files/${file.id}`,
        meta: {
            id: file.id,
            filename: file.filename,
            size: file.size,
            mime: file.mime,
            createdAt: file.createdAt.toISOString(),
        }
    };
});

app.get('/v1/files/:id/meta', async (req, reply) => {
    const {id} = req.params as any;
    const file = await prisma.file.findUnique({
        where: {id},
        select: {
            id: true,
            filename: true,
            size: true,
            mime: true,
            createdAt: true,
        }
    });

    if (!file) return reply.code(404).send({error: 'not_found'});

    return {
        ...file,
        createdAt: file.createdAt.toISOString(),
    };
});

app.get('/v1/files/:id', async (req, reply) => {
    const {id} = req.params as any;
    const file = await prisma.file.findUnique({
        where: {id}
    });

    if (!file) return reply.code(404).send({error: 'not_found'});

    reply.header('content-type', file.mime || 'application/octet-stream');
    reply.header('content-length', file.size);
    reply.header('content-disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
    return reply.send(file.content);
});

app.delete('/v1/files/:id', async (req, reply) => {
    const {id} = req.params as any;
    try {
        await prisma.file.delete({
            where: {id}
        });
        return {ok: true};
    } catch {
        return reply.code(404).send({error: 'not_found'});
    }
});

app.listen({host: STORAGE_HOST, port: STORAGE_PORT}).then(() => {
    app.log.info(`Storage service listening on http://${STORAGE_HOST}:${STORAGE_PORT}`);
});
