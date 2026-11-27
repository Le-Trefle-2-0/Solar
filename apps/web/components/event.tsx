'use client';

import React, {useCallback, useState} from 'react';
import {usePermissions} from "@/hooks/use-permissions";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {format, setHours, setMinutes, setSeconds, startOfWeek} from 'date-fns';
import {fr} from 'date-fns/locale/fr';
import type {EventData, EventRoleSlot} from "@/lib/interface";
import {useSession} from "@/lib/auth-client";
import {toast} from "sonner";
import {apiFetch} from "@/lib/api";
import {Check, Trash2, X} from "lucide-react";
import {canActOnOthers, partHours, splitRoles} from "@/lib/planning";
import {EditEventDialog} from "@/components/planning/edit-event-dialog";

interface EventProps {
    event: EventData;
    /** Roles that can be chosen for a slot when editing the permanence. */
    roles?: { id: string, name: string }[];
    /** Reloads the calendar after a change (registration counts, edit, deletion). */
    onChanged?: () => void;
}

type Registration = EventRoleSlot['registrations'][number];

/** Puts another member on a slot: members holding the slot's role who are not on it yet (#285). */
function AddMember({eventId, slotId, disabled, onAdd}: {
    eventId: string;
    slotId: string;
    disabled: boolean;
    onAdd: (userId: string) => void;
}) {
    const [candidates, setCandidates] = useState<{ id: string, name: string }[] | null>(null);
    const load = () => apiFetch(`/v1/events/${eventId}/slots/${slotId}/candidates`)
        .then(res => setCandidates(res.users ?? []))
        .catch(() => setCandidates([]));

    return (
        <Select value="" disabled={disabled} onOpenChange={(open) => { if (open) load(); }} onValueChange={onAdd}>
            <SelectTrigger className="h-8 w-full text-xs sm:w-56" aria-label="Inscrire un bénévole sur ce créneau">
                <SelectValue placeholder="Inscrire un bénévole…"/>
            </SelectTrigger>
            <SelectContent>
                {candidates === null && <div className="px-2 py-1.5 text-xs text-muted-foreground">Chargement…</div>}
                {candidates?.length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">Personne d&apos;autre ne peut prendre ce créneau.</div>
                )}
                {candidates?.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
        </Select>
    );
}

export default function Event({event, roles = [], onChanged}: EventProps) {
    const time = `${format(new Date(event.start), 'HH:mm', {locale: fr})} - ${format(new Date(event.end), 'HH:mm', {locale: fr})}`;
    const {data: session} = useSession();
    const {can} = usePermissions();

    const [open, setOpen] = useState(false);
    const [eventDetails, setEventDetails] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [removeConfirm, setRemoveConfirm] = useState<{ userId: string, userName: string, slotId: string } | null>(null);

    // Given by the API (Monday 12:00 Paris time); computed locally only for older responses
    const deadline = event.registrationDeadline
        ? new Date(event.registrationDeadline)
        : setSeconds(setMinutes(setHours(startOfWeek(new Date(event.start), {weekStartsOn: 1}), 12), 0), 0);
    const isAfterDeadline = new Date() > deadline;

    const reloadDetails = useCallback(async () => {
        try {
            const res = await apiFetch(`/v1/events/${event.id}`);
            if (res.success && res.event) setEventDetails(res.event);
        } catch (err) {
            console.error("Failed to fetch event details", err);
        }
    }, [event.id]);

    /** Runs a change, then reloads the details and the calendar. */
    async function run(action: () => Promise<any>, success: string | ((res: any) => string)) {
        setLoading(true);
        try {
            const res = await action();
            toast.success(typeof success === 'function' ? success(res) : success);
            await reloadDetails();
            onChanged?.();
            return true;
        } catch (e: any) {
            toast.error(e?.message || 'Erreur inconnue');
            return false;
        } finally {
            setLoading(false);
        }
    }

    const post = (url: string, body: object) => apiFetch(url, {method: 'POST', body: JSON.stringify(body)});

    const register = (slot: EventRoleSlot, userId?: string) => run(
        () => post(`/v1/events/${event.id}/register`, {roleSlotId: slot.id, ...(userId ? {userId} : {})}),
        res => userId ? "Bénévole inscrit"
            : res.registration?.status === 'pending' ? "Demande d'inscription envoyée" : "Inscription validée",
    );

    const unregister = (slot: EventRoleSlot, userId?: string) => run(
        () => post(`/v1/events/${event.id}/unregister`, {roleSlotId: slot.id, ...(userId ? {userId} : {})}),
        userId ? "Bénévole retiré de la permanence" : "Désinscription réussie",
    );

    const setStatus = (registrationId: string, status: 'confirmed' | 'rejected') => run(
        () => post(`/v1/events/registrations/${registrationId}/status`, {status}),
        status === 'confirmed' ? "Inscription approuvée" : "Demande refusée",
    );

    async function handleDelete() {
        setLoading(true);
        try {
            await apiFetch(`/v1/events/${event.id}`, {method: 'DELETE'});
            toast.success("Permanence supprimée");
            setDeleteConfirm(false);
            setOpen(false);
            // The calendar loads its events in the browser: reload them, a router refresh would not (#287)
            onChanged?.();
        } catch (e: any) {
            toast.error(e?.message || "Erreur lors de la suppression");
        } finally {
            setLoading(false);
        }
    }

    const userId = session?.user?.id;
    // Slot eligibility: a slot is for members holding the role it names
    const userRoles = splitRoles((session?.user as any)?.role);
    const canEdit = can('permanence.open');
    const canDelete = can('permanence.close');

    let badgeColor = 'bg-gray-300 text-gray-800';
    const slotsToUse = eventDetails?.roleSlots || event.roleSlots;

    if (slotsToUse) {
        // Role names are configurable: the whole-evening slot (no part) is the manager's,
        // the split slots (first/second part) are the volunteers'
        const managerSlot = slotsToUse.find(slot => !slot.part);
        const part1Slot = slotsToUse.find(slot => slot.part === 'first');
        const part2Slot = slotsToUse.find(slot => slot.part === 'second');

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

    const start = new Date(event.start);
    const end = new Date(event.end);

    const removeButton = (reg: Registration, slot: EventRoleSlot) => (
        <AlertDialog open={removeConfirm?.userId === reg.userId && removeConfirm?.slotId === slot.id}
                     onOpenChange={(o) => { if (!o) setRemoveConfirm(null); }}>
            <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600 hover:bg-red-50"
                        onClick={() => setRemoveConfirm({userId: reg.userId, userName: reg.user?.name || 'cette personne', slotId: slot.id})}
                        disabled={loading} aria-label={`Retirer ${reg.user?.name || 'cette personne'}`} title="Retirer de la permanence">
                    <X className="h-4 w-4"/>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Retirer {removeConfirm?.userName} ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Son inscription à ce créneau sera supprimée.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction disabled={loading} className="bg-red-500 hover:bg-red-600"
                                       onClick={() => { if (removeConfirm) unregister(slot, removeConfirm.userId); setRemoveConfirm(null); }}>
                        Retirer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    return (
        <Dialog open={open} onOpenChange={(next) => {
            setOpen(next);
            if (next) reloadDetails();
        }}>
            <DialogTrigger asChild>
                <Badge className={`cursor-pointer truncate max-w-full ${badgeColor}`}>{event.title}</Badge>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 pr-6">
                        <span>{event.title} du {format(start, "EEEE d MMMM yyyy", {locale: fr})}</span>
                        <span className="flex shrink-0 items-center">
                            {canEdit && eventDetails && (
                                <EditEventDialog event={eventDetails} roles={roles}
                                                 onSaved={() => { reloadDetails(); onChanged?.(); }}/>
                            )}
                            {canDelete && (
                                <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={loading} aria-label="Supprimer la permanence"
                                                title="Supprimer la permanence" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Supprimer cette permanence ?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Cette action est irréversible. La permanence et ses inscriptions seront supprimées.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-red-500 hover:bg-red-600">
                                                Supprimer
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </span>
                    </DialogTitle>
                    <DialogDescription>
                        {time}
                        {isAfterDeadline
                            ? " · Les inscriptions sont désormais soumises à validation."
                            : ` · Inscriptions libres jusqu'au ${format(deadline, "EEEE d MMMM 'à' HH'h'mm", {locale: fr})}.`}
                    </DialogDescription>
                </DialogHeader>

                {eventDetails?.roleSlots && (
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
                            const canRegisterOthers = canActOnOthers(can, userRoles, slot.role, 'register');
                            const canRemoveOthers = canActOnOthers(can, userRoles, slot.role, 'unregister');
                            // After the deadline only a pending request can be withdrawn, unless you manage this slot
                            const canLeave = can('permanence.unregister')
                                && (!isAfterDeadline || userRegistration?.status === 'pending' || canRemoveOthers);

                            const pending = slot.registrations.filter(r => r.status === 'pending');
                            const confirmed = slot.registrations.filter(r => r.status === 'confirmed');

                            let selfLabel: string;
                            if (isRegistered) selfLabel = canLeave ? 'Se désinscrire' : 'Inscrit';
                            else if (!can('permanence.register') || !isEligible) selfLabel = 'Non admissible';
                            else if (isFull) selfLabel = 'Complet';
                            else selfLabel = isAfterDeadline ? "Demander l'inscription" : "S'inscrire";

                            return (
                                <div key={slot.id} className="text-xs flex flex-col gap-2 p-2 border rounded-md">
                                    <div className="flex justify-between items-center gap-2 font-semibold">
                                        <span>
                                            {displayRole}{slot.part ? ` (partie ${slot.part === 'first' ? 1 : 2} : ${partHours(start, end, slot.part)})` : ''}
                                        </span>
                                        <span className="shrink-0">{registeredCount} / {slot.goalCount} inscrits</span>
                                    </div>

                                    {canRegisterOthers && pending.length > 0 && (
                                        <div className="bg-orange-50 p-2 rounded-sm space-y-2 dark:bg-orange-950/40">
                                            <p className="font-bold text-orange-800 dark:text-orange-300">Demandes en attente :</p>
                                            {pending.map(reg => (
                                                <div key={reg.id}
                                                     className="flex justify-between items-center bg-background p-1 rounded border border-orange-200">
                                                    <span>{reg.user?.name || reg.userId}</span>
                                                    <div className="flex gap-1">
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600"
                                                                aria-label={`Approuver ${reg.user?.name ?? ''}`} title="Approuver"
                                                                onClick={() => setStatus(reg.id, 'confirmed')} disabled={loading}>
                                                            <Check className="h-4 w-4"/>
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600"
                                                                aria-label={`Refuser ${reg.user?.name ?? ''}`} title="Refuser"
                                                                onClick={() => setStatus(reg.id, 'rejected')} disabled={loading}>
                                                            <X className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(canRemoveOthers || canRegisterOthers) && confirmed.length > 0 && (
                                        <div className="bg-blue-50 p-2 rounded-sm space-y-2 dark:bg-blue-950/40">
                                            <p className="font-bold text-blue-800 dark:text-blue-300">Inscrits confirmés :</p>
                                            {confirmed.map(reg => (
                                                <div key={reg.id}
                                                     className="flex justify-between items-center bg-background p-1 rounded border border-blue-200">
                                                    <span>{reg.user?.name || reg.userId}</span>
                                                    {canRemoveOthers && reg.userId !== userId && removeButton(reg, slot)}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                                        {canRegisterOthers && (!isFull || can('permanence.register_other_all')) && (
                                            <AddMember eventId={event.id} slotId={slot.id} disabled={loading}
                                                       onAdd={(id) => register(slot, id)}/>
                                        )}
                                        {isRegistered && userRegistration?.status === 'pending' && (
                                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                                                En attente de validation
                                            </Badge>
                                        )}
                                        <Button
                                            size="sm"
                                            variant={isRegistered ? 'destructive' : 'default'}
                                            disabled={loading || (isRegistered
                                                ? !canLeave
                                                : (isFull || !isEligible || !can('permanence.register')))}
                                            title={isRegistered && !canLeave ? "Après le lundi 12h, contactez un référent pour vous désinscrire." : undefined}
                                            onClick={() => isRegistered ? unregister(slot) : register(slot)}
                                        >
                                            {selfLabel}
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
