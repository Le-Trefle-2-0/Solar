'use client';

import React, {useEffect, useState} from 'react';
import {usePermissions} from "@/hooks/use-permissions";
import {
    addDays,
    addMonths,
    differenceInCalendarWeeks,
    endOfMonth,
    endOfWeek,
    format,
    isSameMonth,
    setHours,
    setMinutes,
    setSeconds,
    startOfMonth,
    startOfWeek,
    subMonths
} from 'date-fns';
import {fr} from 'date-fns/locale/fr';
import {CalendarIcon, CalendarPlus, ChevronLeft, ChevronRight} from 'lucide-react';
import Event from './event';
import {EventData} from "@/lib/interface";
import {
    Button,
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Input,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Switch
} from "@/components/ui";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {cn} from "@/lib/utils";
import {Calendar} from "@/components/ui/calendar";
import {toast} from 'sonner';
import {apiFetch} from "@/lib/api";
import {useRouter} from "next/navigation";

const permSchema = z.object({
    startDate: z.date(),
    startTime: z.string(),
    endDate: z.date(),
    endTime: z.string(),
    isBulk: z.boolean(),
    bulkUntil: z.date().optional(),
}).refine(data => {
    if (data.isBulk && !data.bulkUntil) return false;
    return true;
}, {
    message: "La date de fin de série est requise",
    path: ["bulkUntil"]
}).refine(data => {
    if (data.isBulk && data.bulkUntil && data.bulkUntil < data.startDate) return false;
    return true;
}, {
    message: "La date de fin de série doit être après la date de début",
    path: ["bulkUntil"]
})
export default function PlanningCalendar({events, onRefresh}: {
    events: EventData[],
    onRefresh?: () => void
}) {
    type RoleSlotForm = { role: string; goalCount: number; part?: 'first' | 'second' };
    const [defaultSlots, setDefaultSlots] = useState<RoleSlotForm[]>([]);
    const [availableRoles, setAvailableRoles] = useState<{ id: string, name: string }[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        apiFetch('/v1/admin/roles').then((res: any) => {
            if (res.roles) {
                setAvailableRoles(res.roles);
            }
        }).catch((e) => console.error("Failed to load roles", e));
    }, []);

    const createEventForm = useForm<z.infer<typeof permSchema>>({
        resolver: zodResolver(permSchema),
        defaultValues: {
            startDate: new Date(),
            startTime: "20:00",
            endDate: new Date(),
            endTime: "23:00",
            isBulk: false,
        },
    });

    const router = useRouter();
    const refresh = () => (onRefresh ? onRefresh() : router.refresh());
    const [roleSlots, setRoleSlots] = useState<RoleSlotForm[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    // Same permission as POST /v1/events
    const {can} = usePermissions();
    const canCreate = can('permanence.open');

    // Default slots only matter when creating an event, so only those who can create events load them
    useEffect(() => {
        if (!canCreate) return;
        apiFetch('/v1/events/default-slots')
            .then((res: any) => setDefaultSlots(Array.isArray(res?.slots) ? res.slots : []))
            .catch((e) => console.error("Failed to load default slots", e));
    }, [canCreate]);


    const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, {weekStartsOn: 1});
    const endDate = endOfWeek(monthEnd, {weekStartsOn: 1});

    const weeksCount = differenceInCalendarWeeks(endDate, startDate, {weekStartsOn: 1}) + 1;

    const renderCells = () => {
        const rows: React.ReactNode[] = [];
        let days: React.ReactNode[] = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const dayEvents = events.filter(event =>
                    format(new Date(event.start), 'yyyy-MM-dd') === format(cloneDay, 'yyyy-MM-dd')
                );
                const isToday = format(cloneDay, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                days.push(
                    <div
                        key={cloneDay.toString()}
                        className={`flex flex-col border rounded-lg p-1 min-h-[120px] h-full ${
                            !isSameMonth(cloneDay, monthStart) ? 'bg-gray-50 text-gray-400' : ''
                        }`}
                    >
            <span
                className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-red-500 text-white' : ''
                }`}
            >
              {format(cloneDay, 'd')}
            </span>
                        <div className="flex flex-col w-full text-[10px] text-gray-500 space-y-1 overflow-y-auto">
                            {dayEvents.length > 0 ? (
                                dayEvents.map(event => (
                                    <Event key={event.id} event={event} roles={availableRoles} onChanged={refresh}/>
                                ))
                            ) : (
                                <span className="text-gray-300">Aucun</span>
                            )}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div
                    key={day.toString()}
                    className="grid grid-cols-7 gap-2 h-full min-h-[120px]"
                >
                    {days}
                </div>
            );
            days = [];
        }

        return (
            <div
                className="hidden md:grid gap-2 h-full"
                style={{gridTemplateRows: `repeat(${weeksCount}, 1fr)`}}
            >
                {rows}
            </div>
        );
    };

    // On phones seven columns are too narrow: list the days of the month that have permanences (#290)
    const renderAgenda = () => {
        const monthEvents = events
            .filter(event => isSameMonth(new Date(event.start), monthStart))
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        const days = new Map<string, EventData[]>();
        for (const event of monthEvents) {
            const key = format(new Date(event.start), 'yyyy-MM-dd');
            days.set(key, [...(days.get(key) ?? []), event]);
        }
        const today = format(new Date(), 'yyyy-MM-dd');

        return (
            <ul className="md:hidden flex flex-col gap-2 overflow-y-auto pb-2">
                {days.size === 0 && (
                    <li className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                        Aucune permanence ce mois-ci.
                    </li>
                )}
                {[...days.entries()].map(([key, dayEvents]) => (
                    <li key={key} className="flex items-start gap-3 rounded-lg border p-3">
                        <div className={cn(
                            "flex w-12 shrink-0 flex-col items-center rounded-md py-1",
                            key === today ? "bg-red-500 text-white" : "bg-muted"
                        )}>
                            <span className="text-[11px] capitalize">{format(new Date(dayEvents[0].start), 'EEE', {locale: fr})}</span>
                            <span className="text-lg font-semibold leading-tight">{format(new Date(dayEvents[0].start), 'd')}</span>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                            {dayEvents.map(event => (
                                <div key={event.id} className="flex items-center justify-between gap-2 text-sm">
                                    <span className="text-muted-foreground tabular-nums">
                                        {format(new Date(event.start), 'HH:mm')}-{format(new Date(event.end), 'HH:mm')}
                                    </span>
                                    <div className="min-w-0 max-w-[60%]">
                                        <Event event={event} roles={availableRoles} onChanged={refresh}/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    async function createEvent(data: z.infer<typeof permSchema>) {
        if (roleSlots.length === 0) {
            toast.error("Erreur", {
                description: "Vous devez ajouter au moins un créneau pour créer une permanence.",
            });
            return;
        }

        try {
            const sanitizedSlots = roleSlots
                .map(s => ({
                    role: s.role,
                    goalCount: Math.max(1, Number(s.goalCount) || 1),
                    part: s.part,
                }));

            const [startHour, startMinute] = data.startTime.split(":").map(Number)
            const [endHour, endMinute] = data.endTime.split(":").map(Number)

            const eventsToCreate = [];

            if (data.isBulk && data.bulkUntil) {
                let currentDate = new Date(data.startDate);
                const untilDate = new Date(data.bulkUntil);

                while (currentDate <= untilDate) {
                    const start = setSeconds(
                        setMinutes(setHours(new Date(currentDate), startHour), startMinute),
                        0
                    )

                    const originalStart = setSeconds(
                        setMinutes(setHours(new Date(data.startDate), startHour), startMinute),
                        0
                    )
                    const originalEnd = setSeconds(
                        setMinutes(setHours(new Date(data.endDate), endHour), endMinute),
                        0
                    )
                    const durationMs = originalEnd.getTime() - originalStart.getTime();

                    const end = new Date(start.getTime() + durationMs);

                    eventsToCreate.push({
                        title: `Permanence`,
                        description: "Permanence",
                        start,
                        end,
                        roleSlots: sanitizedSlots
                    });

                    currentDate = addDays(currentDate, 1);
                }
            } else {
                const start = setSeconds(
                    setMinutes(setHours(new Date(data.startDate), startHour), startMinute),
                    0
                )
                const end = setSeconds(
                    setMinutes(setHours(new Date(data.endDate), endHour), endMinute),
                    0
                )

                if (start >= end) {
                    toast.error("Erreur", {
                        description: "La date et l'heure de début doivent être avant celles de fin.",
                    })
                    return
                }

                eventsToCreate.push({
                    title: `Permanence`,
                    description: "Permanence",
                    start,
                    end,
                    roleSlots: sanitizedSlots
                });
            }

            for (const payload of eventsToCreate) {
                await apiFetch('/v1/events', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }

            toast.success(`${eventsToCreate.length} permanence(s) créée(s) !`)

            setIsOpen(false)
            refresh()
        } catch (error: any) {
            toast.error("Erreur lors de la création", {description: error?.message || "La permanence n'a pas pu être créée."})
            refresh()
        }
    }

    return (
        <div className="h-full flex flex-col pt-0 px-2 pb-2">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <button type="button" aria-label="Mois précédent" className="rounded p-1 hover:bg-muted"
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                        <ChevronLeft className="h-5 w-5" aria-hidden/>
                    </button>
                    <button type="button" onClick={() => setCurrentMonth(new Date())} className="text-xs px-2 py-1 rounded border">
                        Aujourd’hui
                    </button>
                    <button type="button" aria-label="Mois suivant" className="rounded p-1 hover:bg-muted"
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <ChevronRight className="h-5 w-5" aria-hidden/>
                    </button>
                </div>


                <div className="flex gap-3 justify-end">
                    <h2 className="text-xl font-semibold capitalize">
                        {format(currentMonth, 'MMMM yyyy', {locale: fr})}
                    </h2>
                    {canCreate && (
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" onClick={() => {
                                    setRoleSlots([...defaultSlots]);
                                }}
                                        aria-label="Ajouter une permanence">
                                    <CalendarPlus/>
                                </Button>
                            </DialogTrigger>

                            <DialogContent
                                className="max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[85vh] overflow-y-auto focus:outline-none">
                            <Form {...createEventForm}>
                                <form onSubmit={createEventForm.handleSubmit(createEvent)}>
                                    <DialogHeader>
                                        <DialogTitle>Ajouter une permanence</DialogTitle>
                                    </DialogHeader>

                                    <div className="flex gap-4">
                                        <FormField
                                            control={createEventForm.control}
                                            name="startDate"
                                            render={({field}) => (
                                                <FormItem className="flex flex-col flex-1">
                                                    <FormLabel>Date de début</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? (
                                                                        format(field.value, "PPP", {locale: fr})
                                                                    ) : (
                                                                        <span>Choisir une date</span>
                                                                    )}
                                                                    <CalendarIcon
                                                                        className="ml-auto h-4 w-4 opacity-50"/>
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value}
                                                                onSelect={field.onChange}
                                                                captionLayout="dropdown"
                                                                locale={fr}
                                                                weekStartsOn={1}
                                                                disabled={(date) => date < new Date("1900-01-01")}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={createEventForm.control}
                                            name="startTime"
                                            render={({field}) => (
                                                <FormItem className="flex flex-col flex-1">
                                                    <FormLabel>Heure de début</FormLabel>
                                                    <FormControl>
                                                        <Input type="time" step="60" {...field} />
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex gap-4 mt-4">
                                        <FormField
                                            control={createEventForm.control}
                                            name="endDate"
                                            render={({field}) => (
                                                <FormItem className="flex flex-col flex-1">
                                                    <FormLabel>Date de fin</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? (
                                                                        format(field.value, "PPP", {locale: fr})
                                                                    ) : (
                                                                        <span>Choisir une date</span>
                                                                    )}
                                                                    <CalendarIcon
                                                                        className="ml-auto h-4 w-4 opacity-50"/>
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value}
                                                                onSelect={field.onChange}
                                                                captionLayout="dropdown"
                                                                locale={fr}
                                                                weekStartsOn={1}
                                                                disabled={(date) => date < new Date("1900-01-01")}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={createEventForm.control}
                                            name="endTime"
                                            render={({field}) => (
                                                <FormItem className="flex flex-col flex-1">
                                                    <FormLabel>Heure de fin</FormLabel>
                                                    <FormControl>
                                                        <Input type="time" step="60" {...field} />
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2 mt-4">
                                        <FormField
                                            control={createEventForm.control}
                                            name="isBulk"
                                            render={({field}) => (
                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormLabel
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        Créer en série (tous les jours)
                                                    </FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {createEventForm.watch("isBulk") && (
                                        <div className="flex gap-4 mt-4">
                                            <FormField
                                                control={createEventForm.control}
                                                name="bulkUntil"
                                                render={({field}) => (
                                                    <FormItem className="flex flex-col flex-1">
                                                        <FormLabel>Répéter jusqu'au</FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant="outline"
                                                                        className={cn(
                                                                            "pl-3 text-left font-normal",
                                                                            !field.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {field.value ? (
                                                                            format(field.value, "PPP", {locale: fr})
                                                                        ) : (
                                                                            <span>Choisir une date</span>
                                                                        )}
                                                                        <CalendarIcon
                                                                            className="ml-auto h-4 w-4 opacity-50"/>
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={field.value}
                                                                    onSelect={field.onChange}
                                                                    captionLayout="dropdown"
                                                                    locale={fr}
                                                                    weekStartsOn={1}
                                                                    disabled={(date) => date < new Date("1900-01-01")}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}

                                    <div className="mt-4 border-t pt-4">
                                        <h3 className="text-sm font-semibold mb-2">Gestion des créneaux par rôle</h3>
                                        <div className="space-y-3">
                                            {roleSlots.map((slot, idx) => (
                                                <div key={idx} className="flex items-end gap-3">
                                                    <div className="flex-1">
                                                        <FormLabel>Rôle</FormLabel>
                                                        <Select
                                                            value={slot.role}
                                                            onValueChange={(val) => {
                                                                setRoleSlots(prev => prev.map((s, i) => i === idx ? {
                                                                    role: val,
                                                                    goalCount: s.goalCount,
                                                                    part: s.part ?? 'first'
                                                                } : s));
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Choisir un rôle"/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availableRoles.length > 0 ? (
                                                                    availableRoles.map(role => (
                                                                        <SelectItem key={role.id} value={role.name}>
                                                                            {role.name}
                                                                        </SelectItem>
                                                                    ))
                                                                ) : (
                                                                    <>
                                                                        <SelectItem value="manager">Référent
                                                                            (manager)</SelectItem>
                                                                        <SelectItem value="volunteer">Bénévole
                                                                            (volunteer)</SelectItem>
                                                                    </>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {slot.role && (
                                                        <div className="flex-1">
                                                            <FormLabel>Partie</FormLabel>
                                                            <Select
                                                                value={(slot.part || 'none')}
                                                                onValueChange={(val) => {
                                                                    const partVal = val as 'first' | 'second' | 'none'
                                                                    setRoleSlots(prev => prev.map((s, i) => i === idx ? {
                                                                        ...s,
                                                                        part: partVal === 'none' ? undefined : partVal
                                                                    } : s));
                                                                }}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Choisir une partie"/>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">Tout
                                                                        l'évènement</SelectItem>
                                                                    <SelectItem value="first">Première
                                                                        moitié</SelectItem>
                                                                    <SelectItem value="second">Deuxième
                                                                        moitié</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}
                                                    <div className="w-32">
                                                        <FormLabel>Places</FormLabel>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            value={slot.goalCount || ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                                                setRoleSlots(prev => prev.map((s, i) => i === idx ? {
                                                                    ...s,
                                                                    goalCount: val
                                                                } : s));
                                                            }}
                                                            onBlur={(e) => {
                                                                const val = parseInt(e.target.value) || 1;
                                                                setRoleSlots(prev => prev.map((s, i) => i === idx ? {
                                                                    ...s,
                                                                    goalCount: val
                                                                } : s));
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => setRoleSlots(prev => prev.filter((_, i) => i !== idx))}
                                                        >
                                                            Supprimer
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setRoleSlots(prev => ([...prev, {
                                                    role: availableRoles[0]?.name || 'volunteer',
                                                    goalCount: 1,
                                                    part: 'first'
                                                }]))}
                                            >
                                                Ajouter un créneau
                                            </Button>
                                        </div>
                                    </div>

                                    <DialogFooter className="mt-4">
                                        <DialogClose asChild>
                                            <Button variant="outline">Annuler</Button>
                                        </DialogClose>
                                        <Button type="submit">Sauvegarder</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>
            <div className="hidden md:grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-700 mb-2 flex-shrink-0">
                {daysOfWeek.map(day => (
                    <div key={day}>{day}</div>
                ))}
            </div>
            <div className="flex flex-col flex-grow min-h-0">
                {renderCells()}
                {renderAgenda()}
            </div>
        </div>
    );
}
