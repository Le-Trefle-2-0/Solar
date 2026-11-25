import type {FastifyError, FastifyReply, FastifyRequest} from 'fastify';

/** Only plain `Error`s are written for users; database and runtime errors are subclasses. */
export function publicMessage(err: unknown): string {
    return err instanceof Error && err.constructor === Error ? err.message : 'internal_error';
}

/** Fastify would otherwise send the message of any uncaught error to the client. */
export function errorHandler(error: FastifyError, req: FastifyRequest, reply: FastifyReply) {
    const status = error.statusCode ?? 500;
    if (status < 500) return reply.status(status).send(error);
    req.log.error(error);
    return reply.status(status).send({success: false, error: 'internal_error'});
}
