import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {getUserPermissions, hasPermission} from '../../lib/permissions.js';
import {
    findEvent,
    findEventByChannel,
    getEvents,
    registerUserToEvent,
    removeUserFromEvent,
    saveEvent,
    unregisterUserToEvent,
    updateRegistrationStatus
} from '../../lib/eventManager.js';
import {publicMessage} from '../../lib/errors.js';
import {registerAvailableUsersRoutes} from './availableUsers.js';

const EventSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    start: z.coerce.date(),
    end: z.coerce.date(),
    userId: z.string().min(1),
    roleSlots: z.array(
        z.object({
            role: z.string().min(1),
            goalCount: z.number().int().nonnegative(),
            part: z.enum(["first", "second"]).optional()
        })
    ).min(1, "Au moins un créneau est requis"),
});

async function checkAuth(req: any, reply: any) {
    const userId = await authenticate(req);
    if (!userId) {
        reply.status(401).send('unauthorized');
        return null;
    }
    return userId;
}

export async function registerEventsRoutes(app: FastifyInstance) {
    // Default slots pre-filled when creating an event. Only what the planning needs, for those who
    // can create events: the rest of the settings stays behind settings.manage.
    app.get('/v1/events/default-slots', async (req, reply) => {
        const userId = await checkAuth(req, reply);
        if (!userId) return;
        if (!hasPermission(await getUserPermissions(userId), 'permanence.open')) {
            return reply.status(403).send({success: false, message: "Accès refusé : permission permanence.open requise"});
        }
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
        const userId = await checkAuth(req, reply);
        if (!userId) return;

        try {
            const events = await getEvents();
            return reply.send({success: true, events});
        } catch (err) {
            console.error("Failed to fetch events:", err);
            return reply.status(500).send({success: false, message: "Failed to load events"});
        }
    });

    app.post('/v1/events', async (req, reply) => {
        const userId = await checkAuth(req, reply);
        if (!userId) return;

        // Only allow users with permanence.open permission to create events (sessions)
        const perms = await getUserPermissions(userId);
        if (!hasPermission(perms, 'permanence.open')) {
            return reply.status(403).send({
                success: false,
                message: "Accès refusé : permission permanence.open requise"
            });
        }

        try {
            const body = req.body;
            const validated = EventSchema.parse(body);
            const event = await saveEvent(validated);
            return reply.status(201).send({success: true, event});
        } catch (err) {
            console.error("Event creation failed:", err);
            if (err instanceof z.ZodError) {
                return reply.status(400).send({success: false, errors: err.flatten()});
            }
            return reply.status(500).send({success: false, message: "Internal server error"});
        }
    });

    // GET /v1/events/getAvailable lives in availableUsers.ts
    await registerAvailableUsersRoutes(app);

    app.get('/v1/events/channel/:channelId', async (req, reply) => {
        const userId = await checkAuth(req, reply);
        if (!userId) return;

        const {channelId} = req.params as { channelId: string };
        try {
            const event = await findEventByChannel(channelId);

            if (!event) return reply.status(404).send({success: false, message: "Event not found for this channel"});

            return reply.send({success: true, event});
        } catch (err) {
            console.error("Failed to fetch event by channel:", err);
            return reply.status(500).send({success: false, message: "Internal server error"});
        }
    });

    app.get('/v1/events/:id', async (req, reply) => {
        const userId = await checkAuth(req, reply);
        if (!userId) return;

        const {id} = req.params as { id: string };
        try {
            const event = await findEvent(id);
            if (!event) return reply.status(404).send({success: false, message: "Event not found"});
            return reply.send({success: true, event});
        } catch (err) {
            return reply.status(500).send({success: false, message: "Internal server error"});
        }
    });

    app.put('/v1/events/:id', async (req, reply) => {
        const userId = await checkAuth(req, reply);
        if (!userId) return;

        const {id} = req.params as { id: string };
        try {
            const body = req.body;
            const validated = EventSchema.partial().parse(body);

            // Basic update logic, might need more refinement if we want to update roleSlots specifically
            const event = await prisma.event.update({
                where: {id},
                data: {
                    title: validated.title,
                    description: validated.description,
                    start: validated.start,
                    end: validated.end,
                }
            });
            return reply.send({success: true, event});
        } catch (err) {
            if (err instanceof z.ZodError) return reply.status(400).send({success: false, errors: err.flatten()});
            return reply.status(500).send({success: false, message: "Internal server error"});
        }
    });

    app.delete('/v1/events/:id', async (req, reply) => {
        const userId = await checkAuth(req, reply);
        if (!userId) return;

        // Check if user has permission to close/delete sessions
        const perms = await getUserPermissions(userId);
        if (!hasPermission(perms, 'permanence.close')) {
            return reply.status(403).send({
                success: false,
                message: "Accès refusé : permission permanence.close requise"
            });
        }

        const {id} = req.params as { id: string };
        try {
            await prisma.event.delete({where: {id}});
            return reply.send({success: true});
        } catch (err) {
            return reply.status(500).send({success: false, message: "Internal server error"});
        }
    });

    app.post('/v1/events/:id/register', async (req, reply) => {
        const userId = await checkAuth(req, reply);
        if (!userId) return;

        const {id} = req.params as { id: string };
        const {part, roleSlotId, adminBypass} = (req.body ?? {}) as { part?: 'first' | 'second', roleSlotId?: string, adminBypass?: boolean };

        // If admin bypass is requested, verify user has permission
        if (adminBypass) {
            const perms = await getUserPermissions(userId);
            if (!hasPermission(perms, 'permanence.register_other_user')) {
                return reply.status(403).send({success: false, message: "Permissions insuffisantes pour utiliser le bypass administrateur"});
            }
        }

        try {
            const registration = await registerUserToEvent(id, userId, part, roleSlotId, adminBypass);
            return reply.send({success: true, registration});
        } catch (err: any) {
            req.log.error(err);
            return reply.status(400).send({success: false, message: publicMessage(err)});
        }
    });

    app.post('/v1/events/:id/unregister', async (req, reply) => {
        const userId = await checkAuth(req, reply);
        if (!userId) return;

        const {id} = req.params as { id: string };
        const {part, roleSlotId} = (req.body ?? {}) as { part?: 'first' | 'second', roleSlotId?: string };

        try {
            const registration = await unregisterUserToEvent(id, userId, part, roleSlotId);
            return reply.send({success: true, registration});
        } catch (err: any) {
            req.log.error(err);
            return reply.status(400).send({success: false, message: publicMessage(err)});
        }
    });

    app.post('/v1/events/registrations/:registrationId/status', async (req, reply) => {
        const userId = await checkAuth(req, reply);
        if (!userId) return;

        // Check if user has management permissions
        const perms = await getUserPermissions(userId);
        if (!hasPermission(perms, 'permanence.register_other_user')) {
            return reply.status(403).send({success: false, message: "Forbidden"});
        }

        const {registrationId} = req.params as { registrationId: string };
        const {status} = (req.body ?? {}) as { status: 'confirmed' | 'rejected' };

        try {
            await updateRegistrationStatus(registrationId, status);
            return reply.send({success: true});
        } catch (err: any) {
            req.log.error(err);
            return reply.status(400).send({success: false, message: publicMessage(err)});
        }
    });

    app.post('/v1/events/:id/remove-user', async (req, reply) => {
        const adminUserId = await checkAuth(req, reply);
        if (!adminUserId) return;

        const {id} = req.params as { id: string };
        const {userId, roleSlotId} = (req.body ?? {}) as { userId: string, roleSlotId?: string };

        if (!userId) {
            return reply.status(400).send({success: false, message: "userId is required"});
        }

        try {
            const registration = await removeUserFromEvent(id, userId, adminUserId, roleSlotId);
            return reply.send({success: true, registration});
        } catch (err: any) {
            req.log.error(err);
            return reply.status(400).send({success: false, message: publicMessage(err)});
        }
    });
}
