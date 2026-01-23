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
            registrations: slot.registrations,
        }))
    };
}

export async function registerUserToEvent(eventId: string, userId: string, part?: 'first' | 'second', roleSlotId?: string) {
    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {role: true},
    });

    if (!user || !user.role) {
        throw new Error("User not found.");
    }

    const userRoles = user.role.split(',').map(r => r.trim()).filter(Boolean);

    let targetSlot: any = null;

    if (roleSlotId) {
        targetSlot = await prisma.roleSlot.findUnique({
            where: {id: roleSlotId},
            include: {registrations: true},
        });
        if (!targetSlot) {
            throw new Error("Selected slot not found.");
        }
        if (targetSlot.eventId !== eventId) {
            throw new Error("Selected slot does not belong to this event.");
        }
        if (!userRoles.includes(targetSlot.role)) {
            throw new Error("You are not allowed to register for this slot.");
        }
        if (targetSlot.role === 'volunteer' && targetSlot.part && part && targetSlot.part !== part) {
            throw new Error("Invalid part selection for this slot.");
        }
    } else {
        const roleSlotWhere: any = {
            eventId,
            role: {in: userRoles},
        };

        if (userRoles.includes('volunteer')) {
            if (part) {
                roleSlotWhere.part = part;
            }
        }

        const matchingSlots = await prisma.roleSlot.findMany({
            where: roleSlotWhere,
            include: {registrations: true},
        });

        if (!matchingSlots.length) {
            throw new Error(`No available slots for your roles${part ? ` and part "${part}"` : ''} in this event.`);
        }

        targetSlot = matchingSlots.find(s => s.registrations.length < s.goalCount) ?? matchingSlots[0];
    }

    const alreadyRegistered = await prisma.eventRegistration.findFirst({
        where: {userId, roleSlotId: targetSlot.id},
    });

    if (alreadyRegistered) {
        throw new Error("User is already registered for this slot.");
    }

    if (targetSlot.registrations.length >= targetSlot.goalCount) {
        throw new Error("This slot is full.");
    }

    const registration = await prisma.eventRegistration.create({
        data: {
            userId,
            roleSlotId: targetSlot.id,
            eventId,
        },
    });

    return registration;
}


export async function unregisterUserToEvent(eventId: string, userId: string, part?: 'first' | 'second', roleSlotId?: string) {
    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {role: true},
    });

    if (!user || !user.role) {
        throw new Error("User not found.");
    }

    const userRoles = user.role.split(',').map(r => r.trim()).filter(Boolean);

    let existingReg = null as any;

    if (roleSlotId) {
        const slot = await prisma.roleSlot.findUnique({where: {id: roleSlotId}});
        if (!slot || slot.eventId !== eventId) {
            throw new Error("Selected slot not found in this event.");
        }
        if (!userRoles.includes(slot.role)) {
            throw new Error("You are not allowed to unregister from this slot.");
        }
        existingReg = await prisma.eventRegistration.findFirst({
            where: {userId, roleSlotId},
        });
    } else {
        existingReg = await prisma.eventRegistration.findFirst({
            where: {
                userId,
                roleSlot: {
                    eventId,
                    role: {in: userRoles},
                    ...(userRoles.includes('volunteer') && part ? {part} : {}),
                },
            },
        });
    }

    if (!existingReg) {
        throw new Error("User is not registered for the selected slot.");
    }

    const registration = await prisma.eventRegistration.delete({
        where: {id: existingReg.id},
    });

    return registration;
}