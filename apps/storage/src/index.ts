import {STORAGE_HOST, STORAGE_PORT, STORAGE_SECRET} from './env.js';
import {prisma} from './prisma.js';
import {buildApp} from './app.js';

const metaSelect = {id: true, filename: true, size: true, mime: true, createdAt: true, uploadedById: true} as const;

const app = await buildApp({
    secret: STORAGE_SECRET,
    create: (data) => prisma.file.create({data: {...data, content: Buffer.from(data.content)}, select: metaSelect}),
    findMeta: (id) => prisma.file.findUnique({where: {id}, select: metaSelect}),
    find: (id) => prisma.file.findUnique({where: {id}}),
    remove: async (id) => (await prisma.file.deleteMany({where: {id}})).count > 0,
}, {logger: true});

app.listen({host: STORAGE_HOST, port: STORAGE_PORT}).then(() => {
    app.log.info(`Storage service listening on http://${STORAGE_HOST}:${STORAGE_PORT}`);
});
