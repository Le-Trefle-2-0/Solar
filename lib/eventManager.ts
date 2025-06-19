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

// Fetch all events with role slots and registrations count per slot
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