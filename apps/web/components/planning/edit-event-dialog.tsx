'use client';

import {useState} from 'react';
import {addDays, format} from 'date-fns';
import {Pencil, Plus, Trash2} from 'lucide-react';
import {toast} from 'sonner';
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui';
import {apiFetch} from '@/lib/api';
import type {EventData} from '@/lib/interface';

type SlotRow = {
    id?: string;
    role: string;
    goalCount: number;
    part: 'first' | 'second' | 'none';
    /** Confirmed and pending registrations: such a slot keeps its role and part. */
    taken: number;
};

const toRows = (event: EventData): SlotRow[] => event.roleSlots.map(s => ({
    id: s.id,
    role: s.role,
    goalCount: s.goalCount,
    part: s.part ?? 'none',
    taken: s.registrations?.length ?? (s.registrationsCount + (s.pendingCount ?? 0)),
}));

/** Changes the date, hours and slots of a permanence (#284). Needs permanence.open. */
export function EditEventDialog({event, roles, onSaved}: {
    event: EventData;
    roles: { id: string, name: string }[];
    onSaved: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [slots, setSlots] = useState<SlotRow[]>([]);

    function reset() {
        const start = new Date(event.start);
        setDate(format(start, 'yyyy-MM-dd'));
        setStartTime(format(start, 'HH:mm'));
        setEndTime(format(new Date(event.end), 'HH:mm'));
        setSlots(toRows(event));
    }

    const update = (idx: number, patch: Partial<SlotRow>) =>
        setSlots(prev => prev.map((s, i) => i === idx ? {...s, ...patch} : s));

    // A permanence ending at or before its start time ends the next day (e.g. 22:00-01:00)
    const endsNextDay = !!startTime && !!endTime && endTime <= startTime;
    const removedWithPeople = toRows(event).filter(s => s.taken > 0 && !slots.some(r => r.id === s.id));

    async function save() {
        if (!date || !startTime || !endTime) return toast.error("Indiquez la date et les horaires.");
        if (!slots.length) return toast.error("Gardez au moins un créneau.");
        const start = new Date(`${date}T${startTime}`);
        let end = new Date(`${date}T${endTime}`);
        if (endsNextDay) end = addDays(end, 1);
        setSaving(true);
        try {
            await apiFetch(`/v1/events/${event.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    start: start.toISOString(),
                    end: end.toISOString(),
                    roleSlots: slots.map(s => ({
                        ...(s.id ? {id: s.id} : {}),
                        role: s.role,
                        goalCount: Math.max(1, s.goalCount || 1),
                        part: s.part === 'none' ? null : s.part,
                    })),
                }),
            });
            toast.success("Permanence modifiée");
            setOpen(false);
            onSaved();
        } catch (e: any) {
            toast.error(e?.message || "La permanence n'a pas pu être modifiée.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(next) => {
            if (next) reset();
            setOpen(next);
        }}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Modifier la permanence" title="Modifier la permanence">
                    <Pencil className="h-4 w-4"/>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Modifier la permanence</DialogTitle>
                    <DialogDescription>
                        Les inscrits restent sur leur créneau. Un créneau qui a des inscrits garde son rôle et sa partie.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                        <Label htmlFor="edit-event-date">Date</Label>
                        <Input id="edit-event-date" type="date" value={date} onChange={e => setDate(e.target.value)}/>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="edit-event-start">Début</Label>
                        <Input id="edit-event-start" type="time" step="60" value={startTime}
                               onChange={e => setStartTime(e.target.value)}/>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="edit-event-end">Fin</Label>
                        <Input id="edit-event-end" type="time" step="60" value={endTime}
                               onChange={e => setEndTime(e.target.value)}/>
                    </div>
                </div>
                {endsNextDay && <p className="text-xs text-muted-foreground">La permanence se termine le lendemain.</p>}

                <div className="space-y-3 border-t pt-3">
                    <h3 className="text-sm font-semibold">Créneaux</h3>
                    {slots.map((slot, idx) => {
                        const locked = slot.taken > 0;
                        return (
                            <div key={slot.id ?? `new-${idx}`}
                                 className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1fr_1fr_5rem_auto]">
                                <div className="space-y-1">
                                    <Label>Rôle</Label>
                                    <Select value={slot.role} disabled={locked} onValueChange={role => update(idx, {role})}>
                                        <SelectTrigger><SelectValue placeholder="Choisir un rôle"/></SelectTrigger>
                                        <SelectContent>
                                            {!roles.some(r => r.name === slot.role) && slot.role && (
                                                <SelectItem value={slot.role}>{slot.role}</SelectItem>
                                            )}
                                            {roles.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Partie</Label>
                                    <Select value={slot.part} disabled={locked}
                                            onValueChange={part => update(idx, {part: part as SlotRow['part']})}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Toute la permanence</SelectItem>
                                            <SelectItem value="first">Première moitié</SelectItem>
                                            <SelectItem value="second">Deuxième moitié</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Places</Label>
                                    <Input type="number" min={1} max={100} value={slot.goalCount || ''}
                                           onChange={e => update(idx, {goalCount: parseInt(e.target.value) || 0})}
                                           onBlur={e => update(idx, {goalCount: Math.max(1, parseInt(e.target.value) || 1)})}/>
                                </div>
                                <Button type="button" variant="ghost" size="icon" aria-label="Retirer ce créneau"
                                        title="Retirer ce créneau"
                                        onClick={() => setSlots(prev => prev.filter((_, i) => i !== idx))}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                                {locked && (
                                    <p className="col-span-full -mt-1 text-xs text-muted-foreground">
                                        {slot.taken} inscrit{slot.taken > 1 ? 's' : ''} sur ce créneau
                                    </p>
                                )}
                            </div>
                        );
                    })}
                    <Button type="button" variant="outline" size="sm" onClick={() => setSlots(prev => [...prev, {
                        role: roles[0]?.name ?? '', goalCount: 1, part: 'first', taken: 0,
                    }])}>
                        <Plus className="h-4 w-4"/> Ajouter un créneau
                    </Button>
                    {removedWithPeople.length > 0 && (
                        <p className="text-xs font-medium text-destructive">
                            Les inscriptions des créneaux retirés seront supprimées
                            ({removedWithPeople.reduce((n, s) => n + s.taken, 0)} personne{removedWithPeople.reduce((n, s) => n + s.taken, 0) > 1 ? 's' : ''}).
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button onClick={save} disabled={saving}>Enregistrer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
