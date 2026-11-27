import type {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import {z} from 'zod';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {getActor, hasPermission} from '../../lib/permissions.js';
import {
    findEvent,
    findEventByChannel,
    findSlotCandidates,
    getEvents,
    registerUserToEvent,
    saveEvent,
    unregisterUserToEvent,
    updateEvent,
    updateRegistrationStatus,
} from '../../lib/eventManager.js';
import {publicMessage} from '../../lib/errors.js';
import type {PlanningActor} from '../../lib/planningRules.js';
import {registerAvailableUsersRoutes} from './availableUsers.js';

const SlotSchema = z.object({
    role: z.string().min(1).max(191),
    goalCount: z.number().int().min(1).max(100),
    part: z.enum(["first", "second"]).nullish(),
});

const EventSchema = z.object({
    title: z.string().min(1).max(191),
    description: z.string().max(2000).optional(),
    start: z.coerce.date(),
    end: z.coerce.date(),
    roleSlots: z.array(SlotSchema).min(1, "Au moins un créneau est requis").max(20),
}).refine(e => e.start < e.end, {message: "Le début de la permanence doit précéder sa fin.", path: ['end']});

const EventUpdateSchema = z.object({
    title: z.string().min(1).max(191).optional(),
    description: z.string().max(2000).optional(),
    start: z.coerce.date().optional(),
    end: z.coerce.date().optional(),
    roleSlots: z.array(SlotSchema.extend({id: z.string().min(1).max(191).optional()})).min(1).max(20).optional(),
});

const SlotTargetSchema = z.object({
    part: z.enum(['first', 'second']).optional(),
    roleSlotId: z.string().min(1).max(191).optional(),
    /** Someone else than the person signed in (register_other_* / unregister_other_*). */
    userId: z.string().min(1).max(191).optional(),
    /** Over the number of places (register_other_all). */
    adminBypass: z.boolean().optional(),
});

export interface EventsDeps {
    authenticate: (req: FastifyRequest) => Promise<string | null | undefined>;
    getActor: (userId: string) => Promise<PlanningActor | null>;
}

const defaultDeps: EventsDeps = {authenticate, getActor};

export async function registerEventsRoutes(app: FastifyInstance, deps: EventsDeps = defaultDeps) {
    /** The signed-in person with their roles and permissions, or null once a 401 is sent. */
    async function actorOf(req: FastifyRequest, reply: FastifyReply): Promise<PlanningActor | null> {
        const userId = await deps.authenticate(req);
        const actor = userId ? await deps.getActor(userId) : null;
        if (!actor) {
            reply.status(401).send('unauthorized');
            return null;
        }
        return actor;
    }

    async function requirePermission(req: FastifyRequest, reply: FastifyReply, permission: string) {
        const actor = await actorOf(req, reply);
        if (!actor) return null;
        if (!hasPermission(actor.permissions, permission)) {
            reply.status(403).send({success: false, message: `Accès refusé : permission ${permission} requise`});
            return null;
        }
        return actor;
    }

    const fail = (req: FastifyRequest, reply: FastifyReply, err: unknown) => {
        if (err instanceof z.ZodError) {
            return reply.status(400).send({success: false, message: err.issues[0]?.message, errors: err.flatten()});
        }
        req.log.error(err);
        const message = publicMessage(err);
        return reply.status(message === 'internal_error' ? 500 : 400).send({success: false, message});
    };

    // Default slots pre-filled when creating an event. Only what the planning needs, for those who
    // can create events: the rest of the settings stays behind settings.manage.
    app.get('/v1/events/default-slots', async (req, reply) => {
        if (!await requirePermission(req, reply, 'permanence.open')) return;
        const setting = await prisma.settings.findUnique({where: {key: 'planning_default_slots'}});
        let slots: unknown = [];
        try {
            slots = setting ? JSON.parse(setting.value) : [];
        } catch {
            slots = [];
        }
        return reply.send({success: true, slots: Array.isArray(slots) ? slots : []});
    });

    app.get('/v1/events', async (req, reply) => {
        if (!await actorOf(req, reply)) return;
        try {
            return reply.send({success: true, events: await getEvents()});
        } catch (err) {
            return fail(req, reply, err);
        }
    });

    app.post('/v1/events', async (req, reply) => {
        const actor = await requirePermission(req, reply, 'permanence.open');
        if (!actor) return;
        try {
            const validated = EventSchema.parse(req.body);
            // The author is the person signed in, never a value sent by the browser (#269)
            const event = await saveEvent({
                ...validated,
                userId: actor.id,
                roleSlots: validated.roleSlots.map(s => ({...s, part: s.part ?? undefined})),
            });
            return reply.status(201).send({success: true, event});
        } catch (err) {
            return fail(req, reply, err);
        }
    });

    // GET /v1/events/getAvailable lives in availableUsers.ts
    await registerAvailableUsersRoutes(app);

    app.get('/v1/events/channel/:channelId', async (req, reply) => {
        if (!await actorOf(req, reply)) return;
        const {channelId} = req.params as { channelId: string };
        try {
            const event = await findEventByChannel(channelId);
            if (!event) return reply.status(404).send({success: false, message: "Event not found for this channel"});
            return reply.send({success: true, event});
        } catch (err) {
            return fail(req, reply, err);
        }
    });

    app.get('/v1/events/:id', async (req, reply) => {
        if (!await actorOf(req, reply)) return;
        const {id} = req.params as { id: string };
        try {
            const event = await findEvent(id);
            if (!event) return reply.status(404).send({success: false, message: "Event not found"});
            return reply.send({success: true, event});
        } catch (err) {
            return fail(req, reply, err);
        }
    });

    // Editing a permanence needs the same permission as creating one (#221)
    app.put('/v1/events/:id', async (req, reply) => {
        if (!await requirePermission(req, reply, 'permanence.open')) return;
        const {id} = req.params as { id: string };
        try {
            const changes = EventUpdateSchema.parse(req.body);
            const event = await updateEvent(id, changes);
            return reply.send({success: true, event});
        } catch (err) {
            return fail(req, reply, err);
        }
    });

    app.delete('/v1/events/:id', async (req, reply) => {
        if (!await requirePermission(req, reply, 'permanence.close')) return;
        const {id} = req.params as { id: string };
        try {
            const {count} = await prisma.event.deleteMany({where: {id}});
            if (!count) return reply.status(404).send({success: false, message: "Event not found"});
            return reply.send({success: true});
        } catch (err) {
            return fail(req, reply, err);
        }
    });

    // Members who can be put on a slot by someone else (#285)
    app.get('/v1/events/:id/slots/:slotId/candidates', async (req, reply) => {
        const actor = await actorOf(req, reply);
        if (!actor) return;
        const {id, slotId} = req.params as { id: string, slotId: string };
        try {
            return reply.send({success: true, users: await findSlotCandidates(id, slotId, actor)});
        } catch (err) {
            return fail(req, reply, err);
        }
    });

    app.post('/v1/events/:id/register', async (req, reply) => {
        const actor = await actorOf(req, reply);
        if (!actor) return;
        const {id} = req.params as { id: string };
        try {
            const {part, roleSlotId, userId, adminBypass} = SlotTargetSchema.parse(req.body ?? {});
            const registration = await registerUserToEvent(
                {eventId: id, part, roleSlotId, targetUserId: userId ?? actor.id},
                actor,
                {bypassCapacity: !!adminBypass},
            );
            return reply.send({success: true, registration});
        } catch (err) {
            return fail(req, reply, err);
        }
    });

    app.post('/v1/events/:id/unregister', async (req, reply) => {
        const actor = await actorOf(req, reply);
        if (!actor) return;
        const {id} = req.params as { id: string };
        try {
            const {part, roleSlotId, userId} = SlotTargetSchema.parse(req.body ?? {});
            const registration = await unregisterUserToEvent(
                {eventId: id, part, roleSlotId, targetUserId: userId ?? actor.id},
                actor,
            );
            return reply.send({success: true, registration});
        } catch (err) {
            return fail(req, reply, err);
        }
    });

    // Same as /unregister with a userId, kept for existing clients
    app.post('/v1/events/:id/remove-user', async (req, reply) => {
        const actor = await actorOf(req, reply);
        if (!actor) return;
        const {id} = req.params as { id: string };
        try {
            const {userId, roleSlotId} = SlotTargetSchema.parse(req.body ?? {});
            if (!userId) return reply.status(400).send({success: false, message: "userId is required"});
            const registration = await unregisterUserToEvent({eventId: id, roleSlotId, targetUserId: userId}, actor);
            return reply.send({success: true, registration});
        } catch (err) {
            return fail(req, reply, err);
        }
    });

    app.post('/v1/events/registrations/:registrationId/status', async (req, reply) => {
        const actor = await actorOf(req, reply);
        if (!actor) return;
        const {registrationId} = req.params as { registrationId: string };
        try {
            const {status} = z.object({status: z.enum(['confirmed', 'rejected'])}).parse(req.body ?? {});
            await updateRegistrationStatus(registrationId, status, actor);
            return reply.send({success: true});
        } catch (err) {
            return fail(req, reply, err);
        }
    });
}
