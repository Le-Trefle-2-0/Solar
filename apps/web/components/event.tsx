'use client';

import React, {useEffect, useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {format} from 'date-fns';
import {fr} from 'date-fns/locale/fr';
import type {EventData} from "@/lib/interface";
import {useSession} from "@/lib/auth-client";
import {toast} from "sonner";
import {apiFetch} from "@/lib/api";

interface EventProps {
    event: EventData;
}

export default function Event({event}: EventProps) {
    const time = `${format(new Date(event.start), 'HH:mm', {locale: fr})} - ${format(new Date(event.end), 'HH:mm', {locale: fr})}`;
    const {data: session} = useSession();

    const [open, setOpen] = useState(false);
    const [eventDetails, setEventDetails] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedPart, setSelectedPart] = useState<'part1' | 'part2' | null>(null);

    useEffect(() => {
        apiFetch(`/v1/events/${event.id}`)
            .then(setEventDetails)
            .catch(err => {
                console.error("Failed to fetch event details", err);
            });
    }, [event.id]);

    async function handleRegister(part?: 'first' | 'second', roleSlotId?: string) {
        if (!session?.user?.id) {
            toast.error("Cette action requiert d'être connecté");
            return;
        }

        try {
            setLoading(true);
            const payload: any = {type: "register"};
            if (part) payload.part = part;
            if (roleSlotId) payload.roleSlotId = roleSlotId;
            const body = JSON.stringify(payload);

            const updatedEvent = await apiFetch(`/v1/events/${event.id}`, {
                method: 'POST',
                body,
            });
            setEventDetails(updatedEvent);
            toast.success("Inscription validée");
        } catch (e: any) {
            console.error("Registration failed", e);
            toast.error(e.message || 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    }

    async function handleUnregister(part?: 'first' | 'second', roleSlotId?: string) {
        if (!session?.user?.id) {
            toast.error("Cette action requiert d'être connecté");
            return;
        }

        try {
            setLoading(true);
            const payload: any = {type: "unregister"};
            if (part) payload.part = part;
            if (roleSlotId) payload.roleSlotId = roleSlotId;
            const body = JSON.stringify(payload);

            const updatedEvent = await apiFetch(`/v1/events/${event.id}`, {
                method: 'POST',
                body,
            });
            setEventDetails(updatedEvent);
            toast.success("Désinscription réussie");
        } catch (e: any) {
            console.error("Unregistration failed", e);
            toast.error(e.message || 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    }

    const userId = session?.user?.id;
    const userRoles: string[] = (session?.user?.role || '')
        .split(',')
        .map((r: string) => r.trim())
        .filter(Boolean);

    let badgeColor = 'bg-gray-300 text-gray-800';

    if (eventDetails) {
        const managerSlot = eventDetails.roleSlots.find(slot => slot.role === 'manager');
        const part1Slot = eventDetails.roleSlots.find(slot => slot.role === 'volunteer' && slot.part === 'first');
        const part2Slot = eventDetails.roleSlots.find(slot => slot.role === 'volunteer' && slot.part === 'second');

        const hasManager = managerSlot && managerSlot.registrationsCount >= 1;
        const part1Count = part1Slot?.registrationsCount ?? 0;
        const part2Count = part2Slot?.registrationsCount ?? 0;

        if (hasManager && part1Count >= 3 && part2Count >= 3) {
            badgeColor = 'bg-green-500 text-white';
        } else if (!hasManager || part1Count === 0 || part2Count === 0) {
            badgeColor = 'bg-red-500 text-white';
        } else {
            badgeColor = 'bg-orange-400 text-white';
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Badge className={`cursor-pointer truncate max-w-full ${badgeColor}`}>{event.title}</Badge>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {event.title} du {format(new Date(event.start), "EEEE d MMMM yyyy", {locale: fr})}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">{time}</p>
                </DialogHeader>

                {eventDetails && (
                    <div className="space-y-2 mb-4">
                        {eventDetails.roleSlots.map(slot => {
                            const registeredCount = slot.registrationsCount;

                            const roleDisplayNames: Record<string, string> = {
                                manager: "Référent Bénévoles Écoutants",
                                volunteer: "Bénévole Écoutant"
                            };

                            const displayRole = roleDisplayNames[slot.role] ?? slot.role;

                            const isRegistered = slot.registrations.some(r => r.userId === userId);
                            const isEligible = userRoles.includes(slot.role);
                            const isFull = registeredCount >= slot.goalCount;
                            const labelPart = slot.part ? (slot.part === 'first' ? '1 : 20h00-21h30' : '2 : 21h30-23h00') : '';
                            const partValue = slot.part ? (slot.part as 'first' | 'second') : undefined;
                            return (
                                <div key={slot.id} className="text-xs flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                    <span>
                                      {displayRole} {slot.part ? `(partie ${labelPart})` : ''}
                                    </span>
                                        <span>{registeredCount} / {slot.goalCount} inscrits</span>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            variant={isRegistered ? 'destructive' : 'default'}
                                            disabled={loading || (!isRegistered && (isFull || !isEligible))}
                                            onClick={() => isRegistered
                                                ? handleUnregister(partValue, slot.id)
                                                : handleRegister(partValue, slot.id).then(() => {
                                                }).catch(() => {
                                                })
                                            }
                                        >
                                            {isRegistered ? 'Se désinscrire' : isEligible ? (isFull ? 'Complet' : "S'inscrire") : 'Non admissible'}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}


            </DialogContent>
        </Dialog>
    );
}
