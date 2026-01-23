import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {decodeBytes, sendNewsletter} from '../../lib/newsletter-service.js';

export async function registerNewslettersRoutes(app: FastifyInstance) {

    // Middleware-like role check helper
    const checkNewsletterRole = async (req: any, reply: any) => {
        const userId = await authenticate(req);
        if (!userId) return reply.status(401).send({error: 'unauthorized'});

        const user = await prisma.user.findUnique({where: {id: userId}});
        const roles = (user?.role || "").split(",").map(r => r.trim());
        if (!user || (!roles.includes('newsletterManager') && !roles.includes('admin'))) {
            return reply.status(403).send({error: 'forbidden'});
        }
        return userId;
    };

    // Get subscribed volunteers count
    app.get('/v1/newsletters/volunteers/count', async (req, reply) => {
        await checkNewsletterRole(req, reply);
        const count = await prisma.user.count({
            where: {newsletterSubscription: true}
        });
        return {count};
    });

    // List all newsletters
    app.get('/v1/newsletters', async (req, reply) => {
        await checkNewsletterRole(req, reply);
        return prisma.newsletter.findMany({
            orderBy: {updatedAt: 'desc'},
            include: {author: {select: {name: true, displayUsername: true}}}
        });
    });

    // Get single newsletter
    app.get('/v1/newsletters/:id', async (req, reply) => {
        await checkNewsletterRole(req, reply);
        const {id} = req.params as any;
        const newsletter = await prisma.newsletter.findUnique({
            where: {id},
            include: {author: {select: {name: true, displayUsername: true}}}
        });
        if (!newsletter) return reply.status(404).send({error: 'not_found'});

        // Convert Bytes content back to string/JSON if needed for the frontend
        return {
            ...newsletter,
            content: decodeBytes(newsletter.content),
            htmlContent: newsletter.htmlContent ? decodeBytes(newsletter.htmlContent) : null
        };
    });

    // Create newsletter
    app.post('/v1/newsletters', async (req, reply) => {
        const userId = await checkNewsletterRole(req, reply);
        const {title, content, htmlContent} = req.body as any;

        const newsletter = await prisma.newsletter.create({
            data: {
                title: title || 'Sans titre',
                content: Buffer.from(content || '', 'utf8'),
                htmlContent: htmlContent ? Buffer.from(htmlContent, 'utf8') : null,
                authorId: userId as string,
                status: 'draft'
            }
        });
        return newsletter;
    });

    // Update newsletter
    app.put('/v1/newsletters/:id', async (req, reply) => {
        await checkNewsletterRole(req, reply);
        const {id} = req.params as any;
        const {title, content, htmlContent, status, scheduledAt} = req.body as any;

        const existing = await prisma.newsletter.findUnique({where: {id}});
        if (!existing) return reply.status(404).send({error: 'not_found'});

        if (existing.status === 'sent') {
            return reply.status(400).send({error: 'already_sent'});
        }
        if (existing.status === 'scheduled' && status !== 'draft') {
            return reply.status(400).send({error: 'already_scheduled_unschedule_first'});
        }

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = Buffer.from(content || '', 'utf8');
        if (htmlContent !== undefined) updateData.htmlContent = htmlContent ? Buffer.from(htmlContent, 'utf8') : null;
        if (status !== undefined) updateData.status = status;
        if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;

        const newsletter = await prisma.newsletter.update({
            where: {id},
            data: updateData
        });
        return newsletter;
    });

    // Unschedule newsletter
    app.post('/v1/newsletters/:id/unschedule', async (req, reply) => {
        await checkNewsletterRole(req, reply);
        const {id} = req.params as any;

        const existing = await prisma.newsletter.findUnique({where: {id}});
        if (!existing) return reply.status(404).send({error: 'not_found'});
        if (existing.status !== 'scheduled') return reply.status(400).send({error: 'not_scheduled'});

        const newsletter = await prisma.newsletter.update({
            where: {id},
            data: {status: 'draft', scheduledAt: null}
        });
        return newsletter;
    });

    // Delete newsletter
    app.delete('/v1/newsletters/:id', async (req, reply) => {
        await checkNewsletterRole(req, reply);
        const {id} = req.params as any;
        await prisma.newsletter.delete({where: {id}});
        return {success: true};
    });

    // Send newsletter
    app.post('/v1/newsletters/:id/send', async (req, reply) => {
        await checkNewsletterRole(req, reply);
        const {id} = req.params as any;

        try {
            const data = await sendNewsletter(id);
            return {success: true, data};
        } catch (e: any) {
            if (e.message === 'not_found') return reply.status(404).send({error: 'not_found'});
            if (e.message === 'no_subscribers') return reply.status(400).send({error: 'no_subscribers'});
            return reply.status(500).send({error: String(e)});
        }
    });
}
