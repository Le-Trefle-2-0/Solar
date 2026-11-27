import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {isAllowedImage} from '../../lib/imageValidation.js';
import {limitPerMinute} from '../../lib/rateLimit.js';

export async function registerImageRoutes(app: FastifyInstance) {
    // A few images a minute, each at most MAX_IMAGE_BYTES (#262)
    app.post('/v1/image', {
        ...limitPerMinute(10),
        bodyLimit: 6 * 1024 * 1024,
        // The caller is checked from the headers before a body of up to 6 MiB is read
        onRequest: async (req, reply) => {
            if (!await authenticate(req)) return reply.status(401).send('unauthorized');
        },
    }, async (req, reply) => {
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
