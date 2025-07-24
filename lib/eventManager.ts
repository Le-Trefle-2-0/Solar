import type {EventInput} from "@/lib/interface";
import prisma from "@/lib/prisma";
import {createChannel} from "@/lib/channelsManager";
import {format} from "date-fns";

export async function saveEvent(eventData: EventInput) {
    const {title, description, start, end, userId, roleSlots} = eventData;

    const channel = await createChannel(`${title} du ${format(start, "dd/MM/yyyy")}`);

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
        roleSlots: event.roleSlots.map((slot) => ({
            id: slot.id,
            role: slot.role,
            goalCount: slot.goalCount,
            registrationsCount: slot.registrations.length,
        })),
    }));
}

export async function findEvent(eventId: string) {
    const event = await prisma.event.findUnique({
        where: {
            id: eventId
        },
        include: {
            roleSlots: {
                include: {
                    registrations: {
                        select: {
                            userId: true
                        }
                    },
                },
            },
        },
    });

    if (!event) {
        return event;
    }

    return {
        ...event,
        roleSlots: event.roleSlots.map((slot) => ({
            id: slot.id,
            role: slot.role,
            part: slot.part,
            goalCount: slot.goalCount,
            registrationsCount: slot.registrations.length,
            registrations: slot.registrations, // include userIds
        }))
    };
}

export async function registerUserToEvent(eventId: string, userId: string, part?: 'first' | 'second') {
    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {role: true},
    });

    if (!user || !user.role) {
        throw new Error("User not found.");
    }

    const roleSlotWhere: any = {
        eventId,
        role: user.role,
    };

    if (user.role === 'volunteer') {
        if (part) {
            roleSlotWhere.part = part;
        } else {
            throw new Error("Part must be specified for volunteer registrations.");
        }
    }

    const matchingSlots = await prisma.roleSlot.findMany({
        where: roleSlotWhere,
        include: {
            registrations: true,
        },
    });

    if (!matchingSlots.length) {
        throw new Error(`No available slots for role "${user.role}"${part ? ` and part "${part}"` : ""} in this event.`);
    }

    const alreadyRegistered = await prisma.eventRegistration.findFirst({
        where: {
            userId,
            roleSlot: {
                eventId,
                role: user.role,
                ...(user.role === 'volunteer' && part ? {part} : {}),
            },
        },
    });

    if (alreadyRegistered) {
        throw new Error("User is already registered for this role and time slot in this event.");
    }

    const targetSlot = matchingSlots[0];

    const registration = await prisma.eventRegistration.create({
        data: {
            userId,
            roleSlotId: targetSlot.id,
            eventId,
        },
    });

    return registration;
}


export async function unregisterUserToEvent(eventId: string, userId: string, part?: 'first' | 'second') {
    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {role: true},
    });

    if (!user || !user.role) {
        throw new Error("User not found.");
    }

    const roleSlotWhere: any = {
        eventId,
        role: user.role,
    };

    if (user.role === 'volunteer') {
        if (part) {
            roleSlotWhere.part = part;
        } else {
            throw new Error("Part must be specified for volunteer registrations.");
        }
    }

    const matchingSlots = await prisma.roleSlot.findMany({
        where: roleSlotWhere,
        include: {
            registrations: true,
        },
    });

    if (!matchingSlots.length) {
        throw new Error(`No available slots for role "${user.role}"${part ? ` and part "${part}"` : ""} in this event.`);
    }

    const alreadyRegistered = await prisma.eventRegistration.findFirst({
        where: {
            userId,
            roleSlot: {
                eventId,
                role: user.role,
                ...(user.role === 'volunteer' && part ? {part} : {}),
            },
        },
    });

    if (!alreadyRegistered) {
        throw new Error("User is not already registered for this role and time slot in this event.");
    }

    const registration = await prisma.eventRegistration.delete({
        where: {
            id: alreadyRegistered.id
        },
    });

    return registration;
}