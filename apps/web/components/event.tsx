'use client';

import React, {useEffect, useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {format, isAfter, setHours, setMinutes, setSeconds, startOfWeek} from 'date-fns';
import {fr} from 'date-fns/locale/fr';
import type {EventData} from "@/lib/interface";
import {useSession} from "@/lib/auth-client";
import {toast} from "sonner";
import {apiFetch} from "@/lib/api";
import {useRouter} from "next/navigation";
import {Check, Trash2, X} from "lucide-react";

interface EventProps {
    event: EventData;
}

export default function Event({event}: EventProps) {
    const time = `${format(new Date(event.start), 'HH:mm', {locale: fr})} - ${format(new Date(event.end), 'HH:mm', {locale: fr})}`;
    const {data: session} = useSession();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [eventDetails, setEventDetails] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedPart, setSelectedPart] = useState<'part1' | 'part2' | null>(null);

    const eventDate = new Date(event.start);
    const deadline = setSeconds(setMinutes(setHours(startOfWeek(eventDate, {weekStartsOn: 1}), 12), 0), 0);
    const isAfterDeadline = isAfter(new Date(), deadline);

    useEffect(() => {
        if (open) {
            apiFetch(`/v1/events/${event.id}`)
                .then(res => {
                    if (res.success && res.event) {
                        setEventDetails(res.event);
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch event details", err);
                });
        }
    }, [event.id, open]);

    async function handleRegister(part?: 'first' | 'second', roleSlotId?: string) {
        if (!session?.user?.id) {
            toast.error("Cette action requiert d'être connecté");
            return;
        }

        try {
            setLoading(true);
            const payload: any = {};
            if (part) payload.part = part;
            if (roleSlotId) payload.roleSlotId = roleSlotId;
            const body = JSON.stringify(payload);

            const res = await apiFetch(`/v1/events/${event.id}/register`, {
                method: 'POST',
                body,
            });

            if (res.success) {
                // Refresh event details
                const updated = await apiFetch(`/v1/events/${event.id}`);
                if (updated.success && updated.event) {
                    setEventDetails(updated.event);
                }
                toast.success(res.registration.status === 'pending' ? "Demande d'inscription envoyée" : "Inscription validée");
            }
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
            const payload: any = {};
            if (part) payload.part = part;
            if (roleSlotId) payload.roleSlotId = roleSlotId;
            const body = JSON.stringify(payload);

            const res = await apiFetch(`/v1/events/${event.id}/unregister`, {
                method: 'POST',
                body,
            });

            if (res.success) {
                // Refresh event details
                const updated = await apiFetch(`/v1/events/${event.id}`);
                if (updated.success && updated.event) {
                    setEventDetails(updated.event);
                }
                toast.success("Désinscription réussie");
            }
        } catch (e: any) {
            console.error("Unregistration failed", e);
            toast.error(e.message || 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Voulez-vous vraiment supprimer cette permanence ?")) return;

        try {
            setLoading(true);
            const res = await apiFetch(`/v1/events/${event.id}`, {
                method: 'DELETE'
            });

            if (res.success) {
                toast.success("Permanence supprimée");
                setOpen(false);
                router.refresh();
            }
        } catch (e: any) {
            toast.error(e.message || "Erreur lors de la suppression");
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateRegistrationStatus(registrationId: string, status: 'confirmed' | 'rejected') {
        try {
            setLoading(true);
            const res = await apiFetch(`/v1/events/registrations/${registrationId}/status`, {
                method: 'POST',
                body: JSON.stringify({status})
            });

            if (res.success) {
                toast.success(status === 'confirmed' ? "Inscription approuvée" : "Inscription rejetée");
                // Refresh event details
                const updated = await apiFetch(`/v1/events/${event.id}`);
                if (updated.success && updated.event) {
                    setEventDetails(updated.event);
                }
            }
        } catch (e: any) {
            toast.error(e.message || "Erreur lors de la mise à jour");
        } finally {
            setLoading(false);
        }
    }

    const userId = session?.user?.id;
    const userRoles: string[] = (session?.user?.role || '')
        .split(',')
        .map((r: string) => r.trim())
        .filter(Boolean);

    const isManagerOrAdmin = userRoles.includes('manager') || userRoles.includes('admin');
    const isAdmin = userRoles.includes('admin');

    let badgeColor = 'bg-gray-300 text-gray-800';
    const slotsToUse = eventDetails?.roleSlots || event.roleSlots;

    if (slotsToUse) {
        const managerSlot = slotsToUse.find(slot => slot.role === 'manager');
        const part1Slot = slotsToUse.find(slot => slot.role === 'volunteer' && slot.part === 'first');
        const part2Slot = slotsToUse.find(slot => slot.role === 'volunteer' && slot.part === 'second');

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
                    <DialogTitle className="flex justify-between items-center">
                        <span>{event.title} du {format(new Date(event.start), "EEEE d MMMM yyyy", {locale: fr})}</span>
                        {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        )}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">{time}</p>
                </DialogHeader>

                {eventDetails && eventDetails.roleSlots && (
                    <div className="space-y-4 mb-4">
                        {eventDetails.roleSlots.map(slot => {
                            const registeredCount = slot.registrationsCount;

                            const roleDisplayNames: Record<string, string> = {
                                manager: "Référent Bénévoles Écoutants",
                                volunteer: "Bénévole Écoutant"
                            };

                            const displayRole = roleDisplayNames[slot.role] ?? slot.role;

                            const userRegistration = slot.registrations.find(r => r.userId === userId);
                            const isRegistered = !!userRegistration;
                            const isEligible = userRoles.includes(slot.role);
                            const isFull = registeredCount >= slot.goalCount;
                            const labelPart = slot.part ? (slot.part === 'first' ? '1 : 20h00-21h30' : '2 : 21h30-23h00') : '';
                            const partValue = slot.part ? (slot.part as 'first' | 'second') : undefined;

                            const pendingRegistrations = slot.registrations.filter(r => r.status === 'pending');

                            return (
                                <div key={slot.id} className="text-xs flex flex-col gap-2 p-2 border rounded-md">
                                    <div className="flex justify-between items-center font-semibold">
                                    <span>
                                      {displayRole} {slot.part ? `(partie ${labelPart})` : ''}
                                    </span>
                                        <span>{registeredCount} / {slot.goalCount} inscrits</span>
                                    </div>

                                    {isManagerOrAdmin && pendingRegistrations.length > 0 && (
                                        <div className="bg-orange-50 p-2 rounded-sm space-y-2">
                                            <p className="font-bold text-orange-800">Demandes en attente :</p>
                                            {pendingRegistrations.map(reg => (
                                                <div key={reg.id}
                                                     className="flex justify-between items-center bg-white p-1 rounded border border-orange-200">
                                                    <span>{reg.user?.name || reg.userId}</span>
                                                    <div className="flex gap-1">
                                                        <Button size="icon" variant="ghost"
                                                                className="h-6 w-6 text-green-600"
                                                                onClick={() => handleUpdateRegistrationStatus(reg.id, 'confirmed')}
                                                                disabled={loading}>
                                                            <Check className="h-4 w-4"/>
                                                        </Button>
                                                        <Button size="icon" variant="ghost"
                                                                className="h-6 w-6 text-red-600"
                                                                onClick={() => handleUpdateRegistrationStatus(reg.id, 'rejected')}
                                                                disabled={loading}>
                                                            <X className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex justify-end items-center gap-2">
                                        {isRegistered && userRegistration?.status === 'pending' && (
                                            <Badge variant="outline" className="text-orange-600 border-orange-600">En
                                                attente de validation</Badge>
                                        )}
                                        <Button
                                            size="sm"
                                            variant={isRegistered ? 'destructive' : 'default'}
                                            disabled={loading || (!isRegistered && (isFull || !isEligible))}
                                            onClick={() => isRegistered
                                                ? handleUnregister(partValue, slot.id)
                                                : handleRegister(partValue, slot.id)
                                            }
                                        >
                                            {isRegistered ? 'Se désinscrire' : isEligible ? (isFull ? 'Complet' : (isAfterDeadline ? "Demander l'inscription" : "S'inscrire")) : 'Non admissible'}
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
