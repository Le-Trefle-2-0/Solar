import {Prisma, prisma} from '../prisma.js';
import {createChannel} from './channelsManager.js';
import {format, isAfter, setHours, setMinutes, setSeconds, startOfWeek} from 'date-fns';
import {EventInput} from './types.js';

export async function saveEvent(eventData: EventInput) {
    const {title, description, start, end, userId, roleSlots} = eventData;

    const channel = await createChannel(`${title} du ${format(new Date(start), "dd/MM/yyyy")}`);

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
            registrationsCount: slot.registrations.filter(r => r.status === 'confirmed').length,
            pendingCount: slot.registrations.filter(r => r.status === 'pending').length,
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
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: true,
                                    role: true,
                                }
                            }
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
            registrationsCount: slot.registrations.filter(r => r.status === 'confirmed').length,
            registrations: slot.registrations.map(r => ({
                ...r,
                user: {
                    ...r.user,
                    hasActiveTicket: (r.user as any).Ticket?.length > 0
                }
            })),
        }))
    };
}

export async function findEventByChannel(channelId: string) {
    const event = await prisma.event.findFirst({
        where: {channelID: channelId},
        include: {
            roleSlots: {
                include: {
                    registrations: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: true,
                                    role: true,
                                    Ticket: {
                                        where: {
                                            status: {
                                                name: {not: 'closed'}
                                            }
                                        },
                                        select: {id: true}
                                    }
                                }
                            }
                        }
                    },
                },
            },
        },
    });

    if (!event) return null;

    return {
        ...event,
        roleSlots: event.roleSlots.map((slot) => ({
            id: slot.id,
            role: slot.role,
            part: slot.part,
            goalCount: slot.goalCount,
            registrationsCount: slot.registrations.filter(r => r.status === 'confirmed').length,
            registrations: slot.registrations.map(r => ({
                ...r,
                user: {
                    ...r.user,
                    hasActiveTicket: (r.user as any).Ticket?.length > 0
                }
            })),
        }))
    };
}

export async function registerUserToEvent(eventId: string, userId: string, part?: 'first' | 'second', roleSlotId?: string, adminBypass?: boolean) {
    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {role: true},
    });

    if (!user || !user.role) {
        throw new Error("Utilisateur introuvable.");
    }

    const event = await prisma.event.findUnique({
        where: {id: eventId},
        select: {start: true}
    });

    if (!event) {
        throw new Error("Événement introuvable.");
    }

    const userRoles = user.role.split(',').map(r => r.trim()).filter(Boolean);

    let targetSlot: (Prisma.RoleSlotGetPayload<{ include: { registrations: true } }>) | null = null;

    if (roleSlotId) {
        const foundSlot = await prisma.roleSlot.findUnique({
            where: {id: roleSlotId},
            include: {registrations: true},
        });
        targetSlot = foundSlot as (Prisma.RoleSlotGetPayload<{ include: { registrations: true } }>) | null;
        if (!targetSlot) {
            throw new Error("Créneau sélectionné introuvable.");
        }
        if (targetSlot.eventId !== eventId) {
            throw new Error("Le créneau sélectionné n'appartient pas à cet événement.");
        }
        if (!userRoles.includes(targetSlot.role)) {
            throw new Error("Vous n'êtes pas autorisé à vous inscrire à ce créneau.");
        }
        if (targetSlot.role === 'volunteer' && targetSlot.part && part && targetSlot.part !== part) {
            throw new Error("Sélection de partie invalide pour ce créneau.");
        }
    } else {
        const roleSlotWhere: Prisma.RoleSlotWhereInput = {
            eventId,
            role: {in: userRoles},
        };

        if (userRoles.includes('volunteer')) {
            if (part) {
                roleSlotWhere.part = part;
            }
        }

        const matchingSlots = await prisma.roleSlot.findMany({
            where: roleSlotWhere as Prisma.RoleSlotWhereInput,
            include: {registrations: true},
        });

        if (!matchingSlots.length) {
            throw new Error(`Aucun créneau disponible pour vos rôles${part ? ` et partie "${part}"` : ''} dans cet événement.`);
        }

        const slots = matchingSlots as Prisma.RoleSlotGetPayload<{ include: { registrations: true } }>[];
        targetSlot = slots.find((s) => s.registrations.filter((r: any) => r.status === 'confirmed').length < s.goalCount) ?? slots[0];
    }

    const alreadyRegistered = await prisma.eventRegistration.findFirst({
        where: {userId, roleSlotId: targetSlot?.id},
    });

    if (alreadyRegistered) {
        throw new Error("L'utilisateur est déjà inscrit à ce créneau.");
    }

    // If not admin bypass, check slot capacity
    if (!adminBypass && targetSlot) {
        const confirmedCount = targetSlot.registrations.filter((r: any) => r.status === 'confirmed').length;
        if (confirmedCount >= targetSlot.goalCount) {
            throw new Error("Ce créneau est complet.");
        }
    }

    // Deadline logic: Monday 12:00 of the week of the event
    const eventDate = new Date(event.start);
    const deadline = setSeconds(setMinutes(setHours(startOfWeek(eventDate, {weekStartsOn: 1}), 12), 0), 0);
    const now = new Date();
    const isAdmin = userRoles.includes('admin') || userRoles.includes('manager');
    // Admin/manager bypass deadline and register directly as confirmed, others follow normal deadline logic
    const status = (adminBypass && isAdmin) ? 'confirmed' : (isAfter(now, deadline) ? 'pending' : 'confirmed');

    if (!targetSlot) {
        throw new Error("Cible d'inscription introuvable.");
    }

    const registration = await prisma.eventRegistration.create({
        data: {
            userId,
            roleSlotId: targetSlot.id,
            eventId,
            status,
        },
    });

    return registration;
}

export async function updateRegistrationStatus(registrationId: string, status: 'confirmed' | 'rejected') {
    if (status === 'rejected') {
        return prisma.eventRegistration.delete({
            where: {id: registrationId},
        });
    }
    return prisma.eventRegistration.update({
        where: {id: registrationId},
        data: {status},
    });
}

export async function unregisterUserToEvent(eventId: string, userId: string, part?: 'first' | 'second', roleSlotId?: string) {
    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {role: true},
    });

    if (!user || !user.role) {
        throw new Error("Utilisateur introuvable.");
    }

    const event = await prisma.event.findUnique({
        where: {id: eventId},
        select: {start: true}
    });

    if (!event) {
        throw new Error("Événement introuvable.");
    }

    // Deadline logic: Monday 12:00 of the week of the event
    const eventDate = new Date(event.start);
    const deadline = setSeconds(setMinutes(setHours(startOfWeek(eventDate, {weekStartsOn: 1}), 12), 0), 0);
    const now = new Date();
    
    if (isAfter(now, deadline)) {
        throw new Error("Impossible de se désinscrire après le lundi 12h00 de la semaine de l'événement. Veuillez contacter un responsable ou un administrateur.");
    }

    const userRoles = user.role.split(',').map(r => r.trim()).filter(Boolean);

    let existingReg: Prisma.EventRegistrationGetPayload<{}> | null = null;

    if (roleSlotId) {
        const slot = await prisma.roleSlot.findUnique({where: {id: roleSlotId}});
        if (!slot || slot.eventId !== eventId) {
            throw new Error("Créneau sélectionné introuvable dans cet événement.");
        }
        if (!userRoles.includes(slot.role)) {
            throw new Error("Vous n'êtes pas autorisé à vous désinscrire de ce créneau.");
        }
        existingReg = await prisma.eventRegistration.findFirst({
            where: {userId, roleSlotId},
        });
    } else {
        const where: Prisma.EventRegistrationWhereInput = {
            userId,
            roleSlot: {
                eventId,
                role: {in: userRoles},
            },
        };

        if (userRoles.includes('volunteer') && part) {
            where.roleSlot = {
                ...(where.roleSlot as any),
                part
            };
        }

        existingReg = await prisma.eventRegistration.findFirst({
            where: where as Prisma.EventRegistrationWhereInput,
        });
    }

    if (!existingReg) {
        throw new Error("L'utilisateur n'est pas inscrit à ce créneau.");
    }

    const registration = await prisma.eventRegistration.delete({
        where: {id: existingReg.id},
    });

    return registration;
}

export async function removeUserFromEvent(eventId: string, targetUserId: string, adminUserId: string, roleSlotId?: string) {
    // Check if the admin user has the right permissions
    const adminUser = await prisma.user.findUnique({
        where: {id: adminUserId},
        select: {role: true},
    });

    if (!adminUser || !adminUser.role) {
        throw new Error("Utilisateur administrateur introuvable.");
    }

    const adminRoles = adminUser.role.split(',').map(r => r.trim()).filter(Boolean);
    if (!adminRoles.includes('admin') && !adminRoles.includes('manager')) {
        throw new Error("Permissions insuffisantes. Seuls les administrateurs et responsables peuvent retirer des utilisateurs des événements.");
    }

    // Find the event to verify it exists
    const event = await prisma.event.findUnique({
        where: {id: eventId},
        select: {id: true}
    });

    if (!event) {
        throw new Error("Événement introuvable.");
    }

    // Find the registration to remove
    let existingReg: Prisma.EventRegistrationGetPayload<{}> | null = null;

    if (roleSlotId) {
        const slot = await prisma.roleSlot.findUnique({where: {id: roleSlotId}});
        if (!slot || slot.eventId !== eventId) {
            throw new Error("Créneau sélectionné introuvable dans cet événement.");
        }
        existingReg = await prisma.eventRegistration.findFirst({
            where: {userId: targetUserId, roleSlotId},
        });
    } else {
        existingReg = await prisma.eventRegistration.findFirst({
            where: {
                userId: targetUserId,
                roleSlot: {
                    eventId,
                },
            },
        });
    }

    if (!existingReg) {
        throw new Error("L'utilisateur n'est pas inscrit à ce créneau.");
    }

    // Remove the registration
    const registration = await prisma.eventRegistration.delete({
        where: {id: existingReg.id},
    });

    return registration;
}
