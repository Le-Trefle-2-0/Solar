import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';

import {broadcast} from '../../lib/broadcast.js';
import {getActor, hasPermission, OWNER_SETTING_KEY} from '../../lib/permissions.js';
import {registerRolesRoutes} from './roles.js';
import {parseStatsRange} from '../../lib/statsRange.js';

/** Authenticated user holding `permission` (admin.sudo and the owner hold every permission). */
async function requirePermission(req: any, reply: any, permission: string) {
    const userId = await authenticate(req);
    const actor = userId ? await getActor(userId) : null;
    if (!actor) {
        reply.status(401).send('unauthorized');
        return null;
    }
    if (!hasPermission(actor.permissions, permission)) {
        reply.status(403).send(`forbidden: ${permission} required`);
        return null;
    }
    return actor;
}

export async function registerAdminRoutes(app: FastifyInstance) {
    // Roles and role assignment: see roles.ts
    await registerRolesRoutes(app);

    app.get('/v1/admin/settings', async (req, reply) => {
        const admin = await requirePermission(req, reply, 'settings.manage');
        if (!admin) return;

        try {
            // @ts-ignore
            const settings = await prisma.settings.findMany();
            return reply.send({settings});
        } catch (e) {
            console.error("[Settings] Failed to fetch settings in API:", e);
            return reply.send({settings: []});
        }
    });

    app.post('/v1/admin/settings', async (req, reply) => {
        const admin = await requirePermission(req, reply, 'settings.manage');
        if (!admin) return;

        const {key, value} = req.body as { key: string, value: string };
        if (typeof key !== 'string' || !key || typeof value !== 'string') return reply.status(400).send('invalid setting');
        // Ownership is not a setting anyone with settings.manage may change
        if (key === OWNER_SETTING_KEY) return reply.status(403).send('forbidden: reserved setting');

        try {
            // @ts-ignore
            const setting = await prisma.settings.upsert({
                where: {key},
                update: {value},
                create: {key, value}
            });

            return reply.send({setting});
        } catch (e) {
            console.error("[Settings] Failed to upsert setting in API:", e);
            return reply.status(500).send('failed to update setting');
        }
    });

    app.get('/v1/admin/newsletter/subscribers', async (req, reply) => {
        const admin = await requirePermission(req, reply, 'newsletters.manage');
        if (!admin) return;

        const subscribers = await prisma.newsletterSubscriber.findMany({
            orderBy: {createdAt: 'desc'}
        });
        return reply.send({subscribers});
    });

    app.post('/v1/admin/newsletter/subscribers', async (req, reply) => {
        const admin = await requirePermission(req, reply, 'newsletters.manage');
        if (!admin) return;

        const {email} = req.body as { email: string };
        if (!email) return reply.status(400).send('email is required');

        try {
            const subscriber = await prisma.newsletterSubscriber.upsert({
                where: {email},
                update: {},
                create: {email}
            });
            return reply.send({subscriber});
        } catch (e) {
            console.error("[Newsletter] Failed to add subscriber:", e);
            return reply.status(500).send('failed to add subscriber');
        }
    });

    app.delete('/v1/admin/newsletter/subscribers/:id', async (req, reply) => {
        const admin = await requirePermission(req, reply, 'newsletters.manage');
        if (!admin) return;

        const {id} = req.params as { id: string };

        try {
            await prisma.newsletterSubscriber.delete({
                where: {id}
            });
            return reply.send({success: true});
        } catch (e) {
            console.error("[Newsletter] Failed to delete subscriber:", e);
            return reply.status(500).send('failed to delete subscriber');
        }
    });

    app.get('/v1/admin/team/categories', async (req, reply) => {
        const admin = await requirePermission(req, reply, 'settings.manage');
        if (!admin) return;

        const categories = await prisma.teamCategory.findMany({
            include: {
                members: {
                    include: {
                        person: true
                    },
                    orderBy: {
                        person: {
                            name: 'asc'
                        }
                    }
                }
            },
            orderBy: {order: 'asc'}
        });
        return reply.send({categories});
    });

    app.post('/v1/admin/team/categories', async (req, reply) => {
        const admin = await requirePermission(req, reply, 'settings.manage');
        if (!admin) return;

        const {id, name, icon, type, color, order} = req.body as {
            id?: string,
            name: string,
            icon?: string,
            type?: string,
            color?: string,
            order?: number
        };

        try {
            const category = await prisma.teamCategory.upsert({
                where: {id: id || 'new'},
                update: {name, icon, type, color, order},
                create: {name, icon, type: type || 'DEFAULT', color, order: order || 0}
            });
            return reply.send({category});
        } catch (e) {
            console.error("[Team] Failed to upsert category:", e);
            return reply.status(500).send('failed to update category');
        }
    });

    app.delete('/v1/admin/team/categories/:id', async (req, reply) => {
        const admin = await requirePermission(req, reply, 'settings.manage');
        if (!admin) return;

        const {id} = req.params as { id: string };

        try {
            await prisma.teamCategory.delete({where: {id}});
            return reply.send({success: true});
        } catch (e) {
            console.error("[Team] Failed to delete category:", e);
            return reply.status(500).send('failed to delete category');
        }
    });

    app.post('/v1/admin/team/members', async (req, reply) => {
        const admin = await requirePermission(req, reply, 'settings.manage');
        if (!admin) return;

        const {id, role, isLead, teamName, categoryId, personId} = req.body as {
            id?: string,
            role: string,
            isLead?: boolean,
            teamName?: string,
            categoryId: string,
            personId: string
        };

        try {
            const member = await prisma.teamMember.upsert({
                where: {id: id || 'new'},
                update: {role, isLead, teamName, categoryId, personId},
                create: {role, isLead: isLead || false, teamName, categoryId, personId}
            });
            return reply.send({member});
        } catch (e) {
            console.error("[Team] Failed to upsert member:", e);
            return reply.status(500).send('failed to update member');
        }
    });

    app.get('/v1/admin/team/people', async (req, reply) => {
        const admin = await requirePermission(req, reply, 'settings.manage');
        if (!admin) return;

        const people = await prisma.teamPerson.findMany({
            orderBy: {name: 'asc'}
        });
        return reply.send({people});
    });

    app.post('/v1/admin/team/people', async (req, reply) => {
        const admin = await requirePermission(req, reply, 'settings.manage');
        if (!admin) return;

        const {id, name, image, bio} = req.body as {
            id?: string,
            name: string,
            image?: string,
            bio?: string
        };

        try {
            const person = await prisma.teamPerson.upsert({
                where: {id: id || 'new'},
                update: {name, image, bio},
                create: {name, image, bio}
            });
            return reply.send({person});
        } catch (e) {
            console.error("[Team] Failed to upsert person:", e);
            return reply.status(500).send('failed to update person');
        }
    });

    app.delete('/v1/admin/team/people/:id', async (req, reply) => {
        const admin = await requirePermission(req, reply, 'settings.manage');
        if (!admin) return;

        const {id} = req.params as { id: string };

        try {
            await prisma.teamPerson.delete({where: {id}});
            return reply.send({success: true});
        } catch (e) {
            console.error("[Team] Failed to delete person:", e);
            return reply.status(500).send('failed to delete person');
        }
    });

    app.delete('/v1/admin/team/members/:id', async (req, reply) => {
        const admin = await requirePermission(req, reply, 'settings.manage');
        if (!admin) return;

        const {id} = req.params as { id: string };

        try {
            await prisma.teamMember.delete({where: {id}});
            return reply.send({success: true});
        } catch (e) {
            console.error("[Team] Failed to delete member:", e);
            return reply.status(500).send('failed to delete member');
        }
    });

    app.get('/v1/admin/stats', async (req, reply) => {
        const admin = await requirePermission(req, reply, 'management.view_stats');
        if (!admin) return;

        const range = parseStatsRange(req.query as {start?: string, end?: string, interval?: string});
        if ('error' in range) return reply.status(400).send({success: false, error: range.error});
        const {startDate, endDate, interval} = range;

        // 1. Tickets within range
        const tickets = await prisma.ticket.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                statusName: {in: ['closed', 'commented']}
            }
        });

        // 2. Aggregate metrics
        const volume = tickets.length;
        let totalDuration = 0;
        const categoryCounts: Record<string, number> = {};
        const feedbackStats: Record<string, Record<string, number>> = {
            age: {},
            feeling: {},
            gender: {},
            previouslyOpened: {},
            previouslyAtTrefle: {},
            location: {},
            region: {},
        };

        const ticketIds = tickets.map(t => t.id);
        const allMessages = await prisma.message.findMany({
            where: {
                OR: [
                    {ticketId: {in: ticketIds}},
                    {channelId: {in: tickets.map(t => t.channelId).filter(Boolean) as string[]}}
                ]
            },
            orderBy: {createdAt: 'asc'},
            select: {ticketId: true, channelId: true, createdAt: true}
        });

        const messagesByTicket: Record<number, { createdAt: Date }[]> = {};
        const messagesByChannel: Record<string, { createdAt: Date }[]> = {};

        allMessages.forEach(m => {
            if (m.ticketId) {
                if (!messagesByTicket[m.ticketId]) messagesByTicket[m.ticketId] = [];
                messagesByTicket[m.ticketId].push({createdAt: m.createdAt});
            }
            if (m.channelId) {
                if (!messagesByChannel[m.channelId]) messagesByChannel[m.channelId] = [];
                messagesByChannel[m.channelId].push({createdAt: m.createdAt});
            }
        });

        for (const ticket of tickets) {
            // Compute real duration based on messages
            let messages = messagesByTicket[ticket.id];
            if (!messages && ticket.channelId) {
                messages = messagesByChannel[ticket.channelId];
            }
            if (!messages) messages = [];

            let duration = 0;
            if (messages.length >= 2) {
                duration = Math.floor((messages[messages.length - 1].createdAt.getTime() - messages[0].createdAt.getTime()) / 1000);
            } else {
                // Fallback to ticket timestamps if no messages (rare for closed tickets)
                duration = Math.floor((ticket.updatedAt.getTime() - ticket.createdAt.getTime()) / 1000);
            }
            totalDuration += duration;

            // Categories
            const categories = ticket.categories as string[] || [];
            categories.forEach(cat => {
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            });

            // Feedback
            let feedback = ticket.feedback as any;
            if (feedback && typeof feedback === 'string') {
                try {
                    feedback = JSON.parse(feedback);
                } catch (e) {
                }
            }
            if (feedback && typeof feedback === 'object') {
                Object.keys(feedbackStats).forEach(key => {
                    const value = feedback[key];
                    if (value) {
                        feedbackStats[key][value] = (feedbackStats[key][value] || 0) + 1;
                    }
                });
            }

            // For timeSeries calculation later, we'll need this duration per ticket
            (ticket as any).calculatedDuration = duration;
        }

        // 3. Planning stats (Volunteering time)
        const registrations = await prisma.eventRegistration.findMany({
            where: {
                event: {
                    start: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                status: 'confirmed'
            },
            include: {
                event: true
            }
        });

        let totalVolunteerSeconds = 0;
        registrations.forEach(reg => {
            if (reg.event) {
                const duration = Math.floor((reg.event.end.getTime() - reg.event.start.getTime()) / 1000);
                totalVolunteerSeconds += duration;
            }
        });

        // 4. Time-series data
        const timeSeries: Record<string, { date: string, volume: number, duration: number, volunteer: number }> = {};

        // Helper to get group key
        const getGroupKey = (date: Date) => {
            if (interval === 'month') {
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
            } else if (interval === 'week') {
                const d = new Date(date);
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                const firstDay = new Date(d.setDate(diff));
                return firstDay.toISOString().split('T')[0];
            }
            return date.toISOString().split('T')[0];
        };

        // Initialize points
        const current = new Date(startDate);
        // Reset to start of day
        current.setHours(0, 0, 0, 0);

        while (current <= endDate) {
            const key = getGroupKey(current);
            if (!timeSeries[key]) {
                timeSeries[key] = {date: key, volume: 0, duration: 0, volunteer: 0};
            }

            if (interval === 'month') {
                current.setMonth(current.getMonth() + 1);
            } else if (interval === 'week') {
                current.setDate(current.getDate() + 7);
            } else {
                current.setDate(current.getDate() + 1);
            }
        }

        // Fill ticket data
        tickets.forEach(ticket => {
            const key = getGroupKey(ticket.createdAt);
            if (timeSeries[key]) {
                timeSeries[key].volume += 1;
                const duration = (ticket as any).calculatedDuration || 0;
                timeSeries[key].duration += duration;
            }
        });

        // Fill volunteer data
        registrations.forEach(reg => {
            if (reg.event) {
                const key = getGroupKey(reg.event.start);
                if (timeSeries[key]) {
                    const duration = Math.floor((reg.event.end.getTime() - reg.event.start.getTime()) / 1000);
                    timeSeries[key].volunteer += duration;
                }
            }
        });

        return reply.send({
            volume,
            totalDuration,
            totalVolunteerSeconds,
            categoryCounts,
            feedbackStats,
            timeSeries: Object.values(timeSeries).sort((a, b) => a.date.localeCompare(b.date)),
            startDate,
            endDate
        });
    });
}
