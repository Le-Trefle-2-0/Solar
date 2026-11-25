import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {isAllowedImage} from '../../lib/imageValidation.js';

export async function registerImageRoutes(app: FastifyInstance) {
    app.post('/v1/image', async (req, reply) => {
        const userId = await authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');

        const bodySchema = z.object({
            image: z.string().refine(isAllowedImage, 'invalid_image')
        });

        try {
            const body = bodySchema.parse(req.body);
            const image = await prisma.image.create({
                data: {
                    link: body.image
                }
            });
            return reply.send({success: true, image});
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({success: false, error: error.flatten()});
            }
            req.log.error(error);
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });
}
