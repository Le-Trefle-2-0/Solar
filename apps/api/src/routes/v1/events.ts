import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {createHash} from 'crypto';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {
    findEvent,
    getEvents,
    registerUserToEvent,
    saveEvent,
    unregisterUserToEvent,
    updateRegistrationStatus,
    removeUserFromEvent
} from '../../lib/eventManager.js';

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
    ),
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

        // Only allow users with admin or manager roles to create events
        const user = await prisma.user.findUnique({where: {id: userId}, select: {role: true}});
        const userRoles = (user?.role || '').split(',').map(r => r.trim());
        if (!userRoles.includes('admin') && !userRoles.includes('manager')) {
            return reply.status(403).send({success: false, message: "Accès refusé : rôle admin ou manager requis"});
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

    app.get('/v1/events/getAvailable', async (req, reply) => {
        try {
            const {channelID, lists} = req.query as { channelID?: string, lists?: string };

            // If no channelID provided, return all users (backward compatible)
            if (!channelID) {
                const users = await prisma.user.findMany();
                return reply.send(users);
            }

            // Find the ticket by channelID to determine requester
            const ticket = await prisma.ticket.findUnique({
                where: {channelId: channelID}
            });

            if (!ticket) {
                const users = await prisma.user.findMany();
                return reply.send(users);
            }

            const requesterIdPlain = ticket.discordUserID;
            const requesterIdHash = createHash("sha256").update(requesterIdPlain).digest("hex");

            // If specifically asking for ineligibility lists, compute both (text and voice)
            if (lists === "ineligible") {
                const users = await prisma.user.findMany();

                // Text: 20 days, voice = false
                const textWindowStart = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
                const textTickets = await prisma.ticket.findMany({
                    where: {
                        createdAt: {gte: textWindowStart},
                        voice: false,
                        discordUserID: {in: [requesterIdPlain, requesterIdHash]},
                    },
                    select: {assignedUserId: true},
                });
                const textIds = new Set(
                    textTickets.map(t => t.assignedUserId).filter((id): id is string => !!id)
                );
                const ineligibleText = users.filter(u => textIds.has(u.id));

                // Voice: 30 days, voice = true
                const voiceWindowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const voiceTickets = await prisma.ticket.findMany({
                    where: {
                        createdAt: {gte: voiceWindowStart},
                        voice: true,
                        discordUserID: {in: [requesterIdPlain, requesterIdHash]},
                    },
                    select: {assignedUserId: true},
                });
                const voiceIds = new Set(
                    voiceTickets.map(t => t.assignedUserId).filter((id): id is string => !!id)
                );
                const ineligibleVoice = users.filter(u => voiceIds.has(u.id));

                return reply.send({ineligibleText, ineligibleVoice});
            }

            // Default behavior: compute eligible users for the current ticket modality
            const isVoice = !!ticket.voice;
            const windowDays = isVoice ? 30 : 20;
            const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

            const recentTickets = await prisma.ticket.findMany({
                where: {
                    createdAt: {gte: windowStart},
                    voice: isVoice,
                    discordUserID: {in: [requesterIdPlain, requesterIdHash]},
                },
                select: {assignedUserId: true}
            });

            const excludedUserIds = new Set(
                recentTickets
                    .map(t => t.assignedUserId)
                    .filter((id): id is string => !!id)
            );

            const users = await prisma.user.findMany();
            const eligible = users.filter(u => !excludedUserIds.has(u.id));
            return reply.send(eligible);
        } catch (e) {
            console.error("Failed to compute available users:", e);
            return reply.status(500).send({success: false, error: "Failed to compute available users"});
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

        // Check if user is admin
        const user = await prisma.user.findUnique({where: {id: userId}, select: {role: true}});
        const userRoles = (user?.role || '').split(',').map(r => r.trim());
        if (!userRoles.includes('admin')) {
            return reply.status(403).send({success: false, message: "Forbidden: Admin role required"});
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

        // If admin bypass is requested, verify user has admin/manager role
        if (adminBypass) {
            const user = await prisma.user.findUnique({where: {id: userId}, select: {role: true}});
            const userRoles = (user?.role || '').split(',').map(r => r.trim());
            if (!userRoles.includes('admin') && !userRoles.includes('manager')) {
                return reply.status(403).send({success: false, message: "Permissions insuffisantes pour utiliser le bypass administrateur"});
            }
        }

        try {
            const registration = await registerUserToEvent(id, userId, part, roleSlotId, adminBypass);
            return reply.send({success: true, registration});
        } catch (err: any) {
            return reply.status(400).send({success: false, message: err.message});
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
            return reply.status(400).send({success: false, message: err.message});
        }
    });

    app.post('/v1/events/registrations/:registrationId/status', async (req, reply) => {
        const userId = await checkAuth(req, reply);
        if (!userId) return;

        // Check if user is manager or admin
        const user = await prisma.user.findUnique({where: {id: userId}, select: {role: true}});
        const userRoles = (user?.role || '').split(',').map(r => r.trim());
        if (!userRoles.includes('manager') && !userRoles.includes('admin')) {
            return reply.status(403).send({success: false, message: "Forbidden"});
        }

        const {registrationId} = req.params as { registrationId: string };
        const {status} = (req.body ?? {}) as { status: 'confirmed' | 'rejected' };

        try {
            await updateRegistrationStatus(registrationId, status);
            return reply.send({success: true});
        } catch (err: any) {
            return reply.status(400).send({success: false, message: err.message});
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
            return reply.status(400).send({success: false, message: err.message});
        }
    });
}
