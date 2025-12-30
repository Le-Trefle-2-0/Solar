import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {Resend} from 'resend';

export async function registerNewslettersRoutes(app: FastifyInstance) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Helper to decode Bytes fields from Prisma
    const decodeBytes = (bytes: any): string => {
        if (!bytes) return '';
        if (Buffer.isBuffer(bytes)) {
            return bytes.toString('utf8');
        }
        if (Array.isArray(bytes)) {
            return Buffer.from(bytes).toString('utf8');
        }
        if (typeof bytes === 'object' && bytes.type === 'Buffer' && Array.isArray(bytes.data)) {
            return Buffer.from(bytes.data).toString('utf8');
        }
        return String(bytes);
    };

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

        const newsletter = await prisma.newsletter.findUnique({
            where: {id}
        });

        if (!newsletter) return reply.status(404).send({error: 'not_found'});

        const subscribers = await prisma.user.findMany({
            where: {newsletterSubscription: true},
            select: {email: true}
        });

        if (subscribers.length === 0) {
            return reply.status(400).send({error: 'no_subscribers'});
        }

        // Use the stored HTML content if available, otherwise fallback to a basic wrap of the raw text
        const html = newsletter.htmlContent
            ? decodeBytes(newsletter.htmlContent)
            : `<div>${decodeBytes(newsletter.content)}</div>`;

        const emails = subscribers.map(s => s.email);

        // Resend batch sending or loop
        try {
            const {data, error} = await resend.emails.send({
                from: "Newsletter <newsletter@solar.letrefle.org>",
                to: emails,
                subject: newsletter.title,
                html,
            });

            if (error) {
                console.error('[newsletters] Resend error:', error);
                return reply.status(500).send({error: error.message});
            }

            await prisma.newsletter.update({
                where: {id},
                data: {status: 'sent', sentAt: new Date()}
            });

            return {success: true, data};
        } catch (e: any) {
            console.error('[newsletters] Send error:', e);
            return reply.status(500).send({error: String(e)});
        }
    });
}
