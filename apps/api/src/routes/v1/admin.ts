import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';

import {broadcast} from '../../lib/broadcast.js';

async function checkAdmin(req: any, reply: any) {
    const userId = await authenticate(req);

    if (!userId) {
        return reply.status(401).send('unauthorized');
    }

    const user = await prisma.user.findUnique({where: {id: userId}});
    if (!user) {
        return reply.status(401).send('unauthorized');
    }

    const userRoles = (user.role || "").split(",").map((r: string) => r.trim());
    const isAuthorized = userRoles.includes("admin") || userRoles.includes("manager");

    if (!isAuthorized) {
        return reply.status(401).send('unauthorized');
    }
    return user;
}

export async function registerAdminRoutes(app: FastifyInstance) {
    app.get('/v1/admin/roles', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;

        const roles = await prisma.role.findMany({
            orderBy: {weight: 'desc'}
        });
        return reply.send({roles});
    });

    app.post('/v1/admin/roles', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;

        const {id, name, permissions, weight, icon} = req.body as {
            id?: string,
            name: string,
            permissions: string,
            weight: number,
            icon?: string
        };

        // Hierarchy check: Non-admins can only manage roles with lower weight than their own highest role
        const userRoles = (admin.role || "").split(",");
        if (!userRoles.includes("admin")) {
            const adminHighestRole = await prisma.role.findFirst({
                where: {name: {in: userRoles}},
                orderBy: {weight: 'desc'}
            });

            if (!adminHighestRole || weight >= adminHighestRole.weight) {
                return reply.status(403).send('forbidden: cannot manage roles of equal or higher weight');
            }

            // Check permissions: cannot grant permissions the admin doesn't have
            const adminPerms = JSON.parse(adminHighestRole.permissions || "[]") as string[];
            const requestedPerms = JSON.parse(permissions || "[]") as string[];
            if (requestedPerms.some(p => !adminPerms.includes(p))) {
                return reply.status(403).send('forbidden: cannot grant permissions you do not have');
            }
        }

        const role = await prisma.role.upsert({
            where: id ? {id} : {name},
            update: {name, permissions, weight, icon},
            create: {name, permissions, weight, icon}
        });

        // Broadcast permissions update to all connected volunteers
        await broadcast(null, 'permissionsUpdate', {
            roleId: role.id,
            roleName: role.name,
            permissions: JSON.parse(role.permissions || "[]")
        });

        return reply.send({role});
    });

    app.delete('/v1/admin/roles/:id', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;

        const {id} = req.params as { id: string };

        const roleToDelete = await prisma.role.findUnique({where: {id}});
        if (!roleToDelete) return reply.status(404).send('role not found');

        // Hierarchy check
        const userRoles = (admin.role || "").split(",");
        if (!userRoles.includes("admin")) {
            const adminHighestRole = await prisma.role.findFirst({
                where: {name: {in: userRoles}},
                orderBy: {weight: 'desc'}
            });

            if (!adminHighestRole || roleToDelete.weight >= adminHighestRole.weight) {
                return reply.status(403).send('forbidden: cannot delete roles of equal or higher weight');
            }
        }

        await prisma.role.delete({where: {id}});
        return reply.send({success: true});
    });
    app.post('/v1/admin/users/:id/role', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;

        const {id} = req.params as { id: string };
        const {roles} = (req.body ?? {}) as { roles: string[] };

        if (!Array.isArray(roles)) {
            return reply.status(400).send('Invalid roles');
        }

        const user = await prisma.user.update({
            where: {id},
            data: {
                role: roles.join(',')
            }
        });

        const hideEmails = process.env.HIDE_EMAILS_IN_ADMIN === "true";
        if (hideEmails && user.email) {
            const [localPart, domain] = user.email.split('@');
            if (localPart && domain) {
                const visibleLength = Math.min(3, Math.floor(localPart.length / 2));
                user.email = `${localPart.substring(0, visibleLength)}***@${domain}`;
            } else {
                user.email = "***";
            }
        }

        // @ts-ignore
        delete user.password;
        // @ts-ignore
        delete user.twoFactorSecret;

        return reply.send({user});
    });

    app.get('/v1/admin/settings', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
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
        const admin = await checkAdmin(req, reply);
        if (!admin) return;

        const {key, value} = req.body as { key: string, value: string };

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

    app.get('/v1/admin/stats', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;

        const {start, end, interval = 'day'} = req.query as {
            start?: string,
            end?: string,
            interval?: 'day' | 'week' | 'month'
        };
        const startDate = start ? new Date(start) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endDate = end ? new Date(end) : new Date();

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
                Event: {
                    start: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                status: 'confirmed'
            },
            include: {
                Event: true
            }
        });

        let totalVolunteerSeconds = 0;
        registrations.forEach(reg => {
            if (reg.Event) {
                const duration = Math.floor((reg.Event.end.getTime() - reg.Event.start.getTime()) / 1000);
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
            if (reg.Event) {
                const key = getGroupKey(reg.Event.start);
                if (timeSeries[key]) {
                    const duration = Math.floor((reg.Event.end.getTime() - reg.Event.start.getTime()) / 1000);
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
