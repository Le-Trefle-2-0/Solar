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
import {CalendarMinus, CalendarPlus} from "lucide-react";

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
        fetch(`/api/events/${event.id}`)
            .then(res => res.json())
            .then(setEventDetails)
            .catch(err => {
                console.error("Failed to fetch event details", err);
            });
    }, [event.id]);

    async function handleRegister(part?: 'first' | 'second') {
        if (!session?.user?.id) {
            toast.error("Cette action requiert d'être connecté");
            return;
        }

        try {
            setLoading(true);
            const body = part ? JSON.stringify({part, type: "register"}) : JSON.stringify({type: "register"});

            const res = await fetch(`/api/events/${event.id}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body,
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.message || "Erreur inconnue");
            }
            const updatedEvent = await res.json();
            setEventDetails(updatedEvent);
            toast.success("Inscription validée");
        } catch (e: any) {
            console.error("Registration failed", e);
            toast.error(e.message || 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    }

    async function handleUnregister(part?: 'first' | 'second') {
        if (!session?.user?.id) {
            toast.error("Cette action requiert d'être connecté");
            return;
        }

        try {
            setLoading(true);
            const body = part ? JSON.stringify({part, type: "unregister"}) : JSON.stringify({type: "unregister"});

            const res = await fetch(`/api/events/${event.id}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body,
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.message || "Erreur inconnue");
            }
            const updatedEvent = await res.json();
            setEventDetails(updatedEvent);
            toast.success("Désinscription réussie");
        } catch (e: any) {
            console.error("Unregistration failed", e);
            toast.error(e.message || 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    }

    const userRole = session?.user?.role ?? '';
    const userId = session?.user?.id;

    const userRegisteredParts = eventDetails?.roleSlots
        .filter(slot => slot.registrations.some(r => r.userId === userId))
        .map(slot => slot.part) ?? [];

    const isRegisteredForPart = (part: 'first' | 'second') =>
        userRegisteredParts.includes(part);

    const isRegisteredForWhole = userRegisteredParts.length && userRegisteredParts.every(p => !p);

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

                            return (
                                <div key={slot.id} className="text-xs flex justify-between">
                                  <span>
                                    {displayRole} {slot.part ? `(partie ${slot.part === 'first' ? '1 : 20h00-21h30' : '2 : 21h30-23h00'})` : ''}
                                  </span>
                                    <span>{registeredCount} / {slot.goalCount} inscrits</span>
                                </div>
                            );
                        })}
                    </div>
                )}


                {userRole === 'volunteer' ? (
                    <div className="flex flex-col gap-2">
                        {['first', 'second'].map(part => {
                            const registered = isRegisteredForPart(part as 'first' | 'second');
                            return (
                                <Button
                                    key={part}
                                    onClick={() =>
                                        registered
                                            ? handleUnregister(part as 'first' | 'second')
                                            : handleRegister(part as 'first' | 'second')
                                    }
                                    disabled={loading}
                                    className="w-full"
                                >
                                    {
                                        registered ? <CalendarPlus/> : <CalendarMinus/>
                                    }
                                    {loading && selectedPart === `part${part === 'first' ? '1' : '2'}`}
                                    {registered
                                        ? `Désinscription pour partie ${part === 'first' ? '1' : '2'} (${part === 'first' ? '20h00-21h30' : '21h30-23h00'})`
                                        : `S'inscrire pour partie ${part === 'first' ? '1' : '2'} (${part === 'first' ? '20h00-21h30' : '21h30-23h00'})`}
                                </Button>
                            );
                        })}
                    </div>
                ) : (
                    <Button
                        onClick={() =>
                            isRegisteredForWhole ? handleUnregister() : handleRegister()
                        }
                        disabled={loading}
                        className="w-full"
                    >

                        {
                            isRegisteredForWhole ? <CalendarMinus/> : <CalendarPlus/>
                        }
                        {loading ? "Chargement..." : isRegisteredForWhole ? "Désinscription" : "S'inscrire"}
                    </Button>
                )}
            </DialogContent>
        </Dialog>
    );
}
