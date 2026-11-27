import {Prisma, prisma} from '../prisma.js';
import {createChannel} from './channelsManager.js';
import {format} from 'date-fns';
import {EventInput} from './types.js';
import {hasPermission} from './permissions.js';
import {splitRoles} from './roleAssignment.js';
import {canActOnOthers, planSlotChanges, registrationDeadline, type PlanningActor, type SlotEdit} from './planningRules.js';

const channelName = (title: string, start: Date) => `${title} du ${format(start, "dd/MM/yyyy")}`;

export async function saveEvent(eventData: EventInput) {
    const {title, description, start, end, userId, roleSlots} = eventData;

    const channel = await createChannel(channelName(title, new Date(start)));

    const event = await prisma.event.create({
        data: {
            title,
            description,
            start: new Date(start),
            end: new Date(end),
            userId,
            roleSlots: {
                create: roleSlots.map((slot) => ({
                    role: slot.role,
                    goalCount: slot.goalCount,
                    part: slot.part ?? null,
                })),
            },
            channelID: channel.id,
        },
        include: {
            roleSlots: true,
        },
    });

    return event;
}

export type EventUpdate = {
    title?: string;
    description?: string;
    start?: Date;
    end?: Date;
    roleSlots?: SlotEdit[];
};

/** Edits the times and slots of an event. Removed slots take their registrations with them. */
export async function updateEvent(eventId: string, changes: EventUpdate) {
    return prisma.$transaction(async (tx) => {
        const event = await tx.event.findUnique({
            where: {id: eventId},
            include: {roleSlots: {include: {_count: {select: {registrations: true}}}}},
        });
        if (!event) throw new Error("Permanence introuvable.");

        const start = changes.start ?? event.start;
        const end = changes.end ?? event.end;
        if (start >= end) throw new Error("Le début de la permanence doit précéder sa fin.");

        if (changes.roleSlots) {
            const plan = planSlotChanges(
                event.roleSlots.map(s => ({id: s.id, role: s.role, part: s.part, registrations: s._count.registrations})),
                changes.roleSlots,
            );
            if ('error' in plan) throw new Error(plan.error);
            if (plan.remove.length) await tx.roleSlot.deleteMany({where: {id: {in: plan.remove}, eventId}});
            for (const slot of plan.update) {
                await tx.roleSlot.update({
                    where: {id: slot.id},
                    data: {role: slot.role, goalCount: slot.goalCount, part: slot.part ?? null},
                });
            }
            if (plan.create.length) {
                await tx.roleSlot.createMany({
                    data: plan.create.map(s => ({eventId, role: s.role, goalCount: s.goalCount, part: s.part ?? null})),
                });
            }
        }

        const title = changes.title ?? event.title;
        const updated = await tx.event.update({
            where: {id: eventId},
            data: {title, description: changes.description, start, end},
            include: {roleSlots: true},
        });
        if (title !== event.title || start.getTime() !== event.start.getTime()) {
            await tx.channel.update({where: {id: event.channelID}, data: {name: channelName(title, start)}});
        }
        return updated;
    });
}

export async function getEvents() {
    const events = await prisma.event.findMany({
        orderBy: {start: "asc"},
        include: {
            roleSlots: {
                include: {
                    registrations: true,
                },
            },
        },
    });

    return events.map((event) => ({
        ...event,
        registrationDeadline: registrationDeadline(event.start),
        roleSlots: event.roleSlots.map((slot) => ({
            id: slot.id,
            role: slot.role,
            part: slot.part,
            goalCount: slot.goalCount,
            registrationsCount: slot.registrations.filter(r => r.status === 'confirmed').length,
            pendingCount: slot.registrations.filter(r => r.status === 'pending').length,
        })),
    }));
}

const registrationUser = {
    select: {
        id: true,
        name: true,
        image: true,
        role: true,
        // Busy = an écoute in progress, as the assignment rule counts it (tickets.ts): archived
        // ("commented") écoutes made everyone who ever listened look busy for good
        tickets: {
            where: {statusName: 'started'},
            select: {id: true},
        },
    },
} as const;

async function findEventWhere(where: Prisma.EventWhereInput) {
    const event = await prisma.event.findFirst({
        where,
        include: {
            roleSlots: {
                include: {
                    registrations: {include: {user: registrationUser}},
                },
            },
        },
    });

    if (!event) return null;

    return {
        ...event,
        registrationDeadline: registrationDeadline(event.start),
        roleSlots: event.roleSlots.map((slot) => ({
            id: slot.id,
            role: slot.role,
            part: slot.part,
            goalCount: slot.goalCount,
            registrationsCount: slot.registrations.filter(r => r.status === 'confirmed').length,
            registrations: slot.registrations.map(({user: {tickets, ...user}, ...r}) => ({
                ...r,
                user: {...user, hasActiveTicket: tickets.length > 0},
            })),
        })),
    };
}

export const findEvent = (eventId: string) => findEventWhere({id: eventId});
export const findEventByChannel = (channelId: string) => findEventWhere({channelID: channelId});

type SlotTarget = {eventId: string; part?: 'first' | 'second'; roleSlotId?: string};

/** The slot a registration request is about: the one given, or the first of the person's roles. */
async function resolveSlot({eventId, part, roleSlotId}: SlotTarget, roles: string[], preferFree: boolean) {
    if (roleSlotId) {
        const slot = await prisma.roleSlot.findUnique({where: {id: roleSlotId}, include: {registrations: true}});
        if (!slot || slot.eventId !== eventId) throw new Error("Créneau sélectionné introuvable dans cette permanence.");
        // Split slots (first/second part) must match the requested part, whatever the role is called
        if (slot.part && part && slot.part !== part) throw new Error("Sélection de partie invalide pour ce créneau.");
        return slot;
    }
    const slots = await prisma.roleSlot.findMany({
        where: {
            eventId,
            role: {in: roles},
            // A requested part picks among split slots; slots that are not split stay eligible
            ...(part ? {OR: [{part}, {part: null}]} : {}),
        },
        include: {registrations: true},
    });
    if (!slots.length) {
        throw new Error(`Aucun créneau disponible pour ces rôles${part ? ` et cette partie` : ''} dans cette permanence.`);
    }
    if (!preferFree) return slots[0];
    return slots.find(s => s.registrations.filter(r => r.status === 'confirmed').length < s.goalCount) ?? slots[0];
}

async function findTarget(userId: string) {
    const user = await prisma.user.findUnique({where: {id: userId}, select: {id: true, role: true, banned: true}});
    if (!user || user.banned) throw new Error("Utilisateur introuvable.");
    return {...user, roles: splitRoles(user.role)};
}

/**
 * Registers `targetUserId` on a slot. Yourself: needs permanence.register; after the deadline it
 * is a request a manager approves. Someone else: needs register_other_user on a peer slot or
 * register_other_all, and is confirmed straight away. Going over the number of places needs
 * register_other_all. The count and the insert run in one transaction holding the slot row, so
 * simultaneous registrations cannot overfill it.
 */
export async function registerUserToEvent(
    target: SlotTarget & {targetUserId: string},
    actor: PlanningActor,
    {bypassCapacity = false}: {bypassCapacity?: boolean} = {},
) {
    const self = target.targetUserId === actor.id;
    if (self && !hasPermission(actor.permissions, 'permanence.register')) {
        throw new Error("Vous n'avez pas la permission de vous inscrire au planning.");
    }
    if (bypassCapacity && !hasPermission(actor.permissions, 'permanence.register_other_all')) {
        throw new Error("Permissions insuffisantes pour dépasser le nombre de places.");
    }

    const event = await prisma.event.findUnique({where: {id: target.eventId}, select: {start: true}});
    if (!event) throw new Error("Permanence introuvable.");

    const user = await findTarget(target.targetUserId);
    const slot = await resolveSlot(target, user.roles, true);
    if (!self && !canActOnOthers(actor, slot.role, 'register')) {
        throw new Error("Permissions insuffisantes pour inscrire quelqu'un sur ce créneau.");
    }
    if (!user.roles.includes(slot.role)) {
        throw new Error(self
            ? "Vous n'êtes pas autorisé à vous inscrire à ce créneau."
            : "Cette personne n'a pas le rôle demandé par ce créneau.");
    }

    const afterDeadline = new Date() > registrationDeadline(event.start);
    const status = self && afterDeadline ? 'pending' : 'confirmed';

    return prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM role_slot WHERE id = ${slot.id} FOR UPDATE`;
        const existing = await tx.eventRegistration.findFirst({where: {userId: user.id, roleSlotId: slot.id}});
        if (existing) throw new Error(self ? "Vous êtes déjà inscrit à ce créneau." : "Cette personne est déjà inscrite à ce créneau.");
        const confirmed = await tx.eventRegistration.count({where: {roleSlotId: slot.id, status: 'confirmed'}});
        if (!bypassCapacity && confirmed >= slot.goalCount) throw new Error("Ce créneau est complet.");
        return tx.eventRegistration.create({
            data: {userId: user.id, roleSlotId: slot.id, eventId: target.eventId, status},
        });
    });
}

/**
 * Removes the registration of `targetUserId`. Yourself: needs permanence.unregister, and after the
 * deadline only a request still pending can be withdrawn. Someone else, or yourself after the
 * deadline: unregister_other_user on a peer slot or unregister_other_all.
 */
export async function unregisterUserToEvent(target: SlotTarget & {targetUserId: string}, actor: PlanningActor) {
    const self = target.targetUserId === actor.id;
    if (self && !hasPermission(actor.permissions, 'permanence.unregister')) {
        throw new Error("Vous n'avez pas la permission de vous désinscrire du planning.");
    }

    const event = await prisma.event.findUnique({where: {id: target.eventId}, select: {start: true}});
    if (!event) throw new Error("Permanence introuvable.");

    const user = await prisma.user.findUnique({where: {id: target.targetUserId}, select: {id: true, role: true}});
    if (!user) throw new Error("Utilisateur introuvable.");

    let registration;
    if (target.roleSlotId) {
        const slot = await resolveSlot(target, [], false);
        registration = await prisma.eventRegistration.findFirst({
            where: {userId: user.id, roleSlotId: slot.id},
            include: {roleSlot: true},
        });
    } else {
        registration = await prisma.eventRegistration.findFirst({
            where: {
                userId: user.id,
                roleSlot: {eventId: target.eventId, ...(target.part ? {OR: [{part: target.part}, {part: null}]} : {})},
            },
            include: {roleSlot: true},
        });
    }
    if (!registration) throw new Error("Cette personne n'est pas inscrite à ce créneau.");

    const manages = canActOnOthers(actor, registration.roleSlot.role, 'unregister');
    if (!self && !manages) throw new Error("Permissions insuffisantes pour retirer quelqu'un de ce créneau.");
    if (self && !manages && registration.status !== 'pending' && new Date() > registrationDeadline(event.start)) {
        throw new Error("Impossible de se désinscrire après le lundi 12h00 de la semaine de la permanence. Veuillez contacter un référent.");
    }

    return prisma.eventRegistration.delete({where: {id: registration.id}});
}

/**
 * Approves or refuses a registration request made after the deadline. Only pending requests:
 * a confirmed registration is removed through unregistering, with its own rules.
 */
export async function updateRegistrationStatus(registrationId: string, status: 'confirmed' | 'rejected', actor: PlanningActor) {
    const registration = await prisma.eventRegistration.findUnique({
        where: {id: registrationId},
        include: {roleSlot: true},
    });
    if (!registration) throw new Error("Inscription introuvable.");
    if (!canActOnOthers(actor, registration.roleSlot.role, 'register')) {
        throw new Error("Permissions insuffisantes pour traiter les demandes de ce créneau.");
    }
    if (registration.status !== 'pending') throw new Error("Cette inscription n'est plus en attente.");

    if (status === 'rejected') {
        return prisma.eventRegistration.delete({where: {id: registrationId}});
    }

    const bypassCapacity = hasPermission(actor.permissions, 'permanence.register_other_all');
    return prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM role_slot WHERE id = ${registration.roleSlotId} FOR UPDATE`;
        const confirmed = await tx.eventRegistration.count({where: {roleSlotId: registration.roleSlotId, status: 'confirmed'}});
        if (!bypassCapacity && confirmed >= registration.roleSlot.goalCount) throw new Error("Ce créneau est complet.");
        const result = await tx.eventRegistration.updateMany({
            where: {id: registrationId, status: 'pending'},
            data: {status: 'confirmed'},
        });
        if (result.count === 0) throw new Error("Cette inscription n'est plus en attente.");
        return {id: registrationId, status: 'confirmed'};
    });
}

/** Members who hold the slot's role and are not on it yet, for registering someone else. */
export async function findSlotCandidates(eventId: string, roleSlotId: string, actor: PlanningActor) {
    const slot = await prisma.roleSlot.findUnique({
        where: {id: roleSlotId},
        include: {registrations: {select: {userId: true}}},
    });
    if (!slot || slot.eventId !== eventId) throw new Error("Créneau sélectionné introuvable dans cette permanence.");
    if (!canActOnOthers(actor, slot.role, 'register')) {
        throw new Error("Permissions insuffisantes pour inscrire quelqu'un sur ce créneau.");
    }
    const taken = new Set(slot.registrations.map(r => r.userId));
    const users = await prisma.user.findMany({
        where: {role: {contains: slot.role}, OR: [{banned: null}, {banned: false}]},
        select: {id: true, name: true, role: true},
        orderBy: {name: 'asc'},
    });
    return users
        .filter(u => splitRoles(u.role).includes(slot.role) && !taken.has(u.id))
        .map(u => ({id: u.id, name: u.name}));
}
