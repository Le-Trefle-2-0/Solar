import type {EventInput} from "@/lib/interface";
import prisma from "@/lib/prisma";

export async function saveEvent(eventData: EventInput) {
    const {title, description, start, end, userId, roleSlots} = eventData;

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
                })),
            },
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
                    registrations: true,
                },
            },
        },
    });

    if (!event) {
        return event;
    }

    return {
        ...event, roleSlots: event.roleSlots.map((slot) => ({
            id: slot.id,
            role: slot.role,
            goalCount: slot.goalCount,
            registrationsCount: slot.registrations.length,
        }))
    };
}

export async function registerUserToEvent(eventId: string, userId: string) {
    // Step 1: Get the user's role
    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {role: true},
    });

    if (!user) {
        throw new Error("User not found.");
    }

    // Step 2: Fetch all role slots for this event that match the user's role
    const matchingSlots = await prisma.roleSlot.findMany({
        where: {
            eventId,
            role: user.role as string,
        },
        include: {
            registrations: true, // Required to access registrations.length
        },
    });

    if (!matchingSlots.length) {
        throw new Error(`No available slots for role "${user.role}" in this event.`);
    }

    // Step 3: Check if user is already registered in any matching slot
    const alreadyRegistered = await prisma.eventRegistration.findFirst({
        where: {
            userId,
            roleSlot: {
                eventId,
                role: user.role as string,
            },
        },
    });

    if (alreadyRegistered) {
        throw new Error("User is already registered for this role in this event.");
    }

    // Step 4: Register user to the first matching slot (no hard cap)
    const targetSlot = matchingSlots[0]; // Just use the first available slot

    const registration = await prisma.eventRegistration.create({
        data: {
            userId,
            roleSlotId: targetSlot.id,
            eventId,
        },
    });

    return registration;
}