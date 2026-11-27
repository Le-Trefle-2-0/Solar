import type {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import {z} from 'zod';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {decodeBytes, sendNewsletter} from '../../lib/newsletter-service.js';
import {getUserPermissions, hasPermission} from '../../lib/permissions.js';

/** Editor JSON and rendered HTML; images are inlined, hence the generous but finite limit. */
const MAX_CONTENT = 2 * 1024 * 1024;

const writableFields = {
    title: z.string().max(200),
    content: z.string().max(MAX_CONTENT),
    htmlContent: z.string().max(MAX_CONTENT).nullable(),
    target: z.enum(['private', 'public']),
};

const createSchema = z.object({
    title: writableFields.title.optional(),
    content: writableFields.content.optional(),
    htmlContent: writableFields.htmlContent.optional(),
    target: writableFields.target.optional(),
}).strict();

const updateSchema = createSchema.extend({
    // "sent" is only ever set by sendNewsletter
    status: z.enum(['draft', 'scheduled']).optional(),
    scheduledAt: z.string().datetime({offset: true}).nullable().optional(),
}).strict();

const idParams = z.object({id: z.string().min(1).max(64)});

export async function registerNewslettersRoutes(app: FastifyInstance) {
    /**
     * Runs before every newsletter route. Replying here ends the request: the old helper sent
     * a 403 and let the handler carry on (#240).
     */
    const requireNewsletterRole = async (req: FastifyRequest, reply: FastifyReply) => {
        const userId = await authenticate(req);
        if (!userId) return reply.status(401).send({error: 'unauthorized'});
        if (!hasPermission(await getUserPermissions(userId), 'newsletters.manage')) {
            return reply.status(403).send({error: 'forbidden'});
        }
        (req as FastifyRequest & {userId?: string}).userId = userId;
    };
    const guarded = {preHandler: requireNewsletterRole, bodyLimit: 5 * MAX_CONTENT};
    const userIdOf = (req: FastifyRequest) => (req as FastifyRequest & {userId?: string}).userId!;

    const parse = <T>(schema: z.ZodType<T>, value: unknown, reply: FastifyReply): T | null => {
        const result = schema.safeParse(value ?? {});
        if (!result.success) {
            reply.status(400).send({error: 'invalid_request', details: result.error.flatten()});
            return null;
        }
        return result.data;
    };

    // Get counts
    app.get('/v1/newsletters/counts', guarded, async () => {
        const volunteers = await prisma.user.count({where: {newsletterSubscription: true}});
        const subscribers = await prisma.newsletterSubscriber.count();
        return {volunteers, subscribers};
    });

    // List all newsletters
    app.get('/v1/newsletters', guarded, async () => prisma.newsletter.findMany({
        orderBy: {updatedAt: 'desc'},
        include: {author: {select: {name: true, displayUsername: true}}},
    }));

    // Get single newsletter
    app.get('/v1/newsletters/:id', guarded, async (req, reply) => {
        const params = parse(idParams, req.params, reply);
        if (!params) return;
        const newsletter = await prisma.newsletter.findUnique({
            where: {id: params.id},
            include: {author: {select: {name: true, displayUsername: true}}},
        });
        if (!newsletter) return reply.status(404).send({error: 'not_found'});

        // Convert Bytes content back to string/JSON if needed for the frontend
        return {
            ...newsletter,
            content: decodeBytes(newsletter.content),
            htmlContent: newsletter.htmlContent ? decodeBytes(newsletter.htmlContent) : null,
        };
    });

    // Create newsletter
    app.post('/v1/newsletters', guarded, async (req, reply) => {
        const body = parse(createSchema, req.body, reply);
        if (!body) return;
        return prisma.newsletter.create({
            data: {
                title: body.title || 'Sans titre',
                content: Buffer.from(body.content ?? '', 'utf8'),
                htmlContent: body.htmlContent ? Buffer.from(body.htmlContent, 'utf8') : null,
                target: body.target ?? 'private',
                authorId: userIdOf(req),
                status: 'draft',
            },
        });
    });

    // Update newsletter
    app.put('/v1/newsletters/:id', guarded, async (req, reply) => {
        const params = parse(idParams, req.params, reply);
        const body = params && parse(updateSchema, req.body, reply);
        if (!params || !body) return;

        const existing = await prisma.newsletter.findUnique({where: {id: params.id}});
        if (!existing) return reply.status(404).send({error: 'not_found'});

        if (existing.status === 'sent') {
            return reply.status(400).send({error: 'already_sent'});
        }
        if (existing.status === 'scheduled' && body.status !== 'draft') {
            return reply.status(400).send({error: 'already_scheduled_unschedule_first'});
        }
        if (body.status === 'scheduled' && !body.scheduledAt && !existing.scheduledAt) {
            return reply.status(400).send({error: 'scheduled_at_required'});
        }

        const updateData: Record<string, unknown> = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.content !== undefined) updateData.content = Buffer.from(body.content, 'utf8');
        if (body.htmlContent !== undefined) updateData.htmlContent = body.htmlContent ? Buffer.from(body.htmlContent, 'utf8') : null;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.scheduledAt !== undefined) updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
        if (body.target !== undefined) updateData.target = body.target;

        return prisma.newsletter.update({where: {id: params.id}, data: updateData});
    });

    // Unschedule newsletter
    app.post('/v1/newsletters/:id/unschedule', guarded, async (req, reply) => {
        const params = parse(idParams, req.params, reply);
        if (!params) return;

        const existing = await prisma.newsletter.findUnique({where: {id: params.id}});
        if (!existing) return reply.status(404).send({error: 'not_found'});
        if (existing.status !== 'scheduled') return reply.status(400).send({error: 'not_scheduled'});

        return prisma.newsletter.update({
            where: {id: params.id},
            data: {status: 'draft', scheduledAt: null},
        });
    });

    // Delete newsletter
    app.delete('/v1/newsletters/:id', guarded, async (req, reply) => {
        const params = parse(idParams, req.params, reply);
        if (!params) return;
        const deleted = await prisma.newsletter.deleteMany({where: {id: params.id}});
        if (!deleted.count) return reply.status(404).send({error: 'not_found'});
        return {success: true};
    });

    // Send newsletter
    app.post('/v1/newsletters/:id/send', guarded, async (req, reply) => {
        const params = parse(idParams, req.params, reply);
        if (!params) return;

        try {
            const data = await sendNewsletter(params.id);
            return {success: true, data};
        } catch (e: any) {
            if (e.message === 'not_found') return reply.status(404).send({error: 'not_found'});
            if (e.message === 'no_subscribers') return reply.status(400).send({error: 'no_subscribers'});
            req.log.error(e);
            return reply.status(500).send({error: 'internal_error'});
        }
    });
}
