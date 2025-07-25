'use client';

import React, {useState} from 'react';
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
    PopoverTrigger
} from "@/components/ui";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {cn} from "@/lib/utils";
import {Calendar} from "@/components/ui/calendar";
import {toast} from 'sonner';
import {useRouter} from "next/navigation";

const permSchema = z.object({
    startDate: z.date(),
    startTime: z.string(),
    endDate: z.date(),
    endTime: z.string(),
})
export default function PlanningCalendar({events, userId}: { events: EventData[], userId?: string }) {
    const createEventForm = useForm<z.infer<typeof permSchema>>({
        resolver: zodResolver(permSchema),
        defaultValues: {
            startDate: new Date(),
            startTime: "20:00",
            endDate: new Date(),
            endTime: "23:00",
        },
    });

    const router = useRouter();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    async function createTestEvents() {
        if (!userId) {
            alert("Impossible de créer les événements de test : utilisateur non connecté");
            return;
        }

        try {
            const today = new Date();
            for (let i = 0; i < 30; i++) {
                const date = addDays(today, i);
                const start = setMinutes(setHours(date, 20), 0);
                const end = setMinutes(setHours(date, 23), 0);
                const payload = {
                    title: `Permanence`,
                    description: "Créé automatiquement pour les tests",
                    start,
                    end,
                    userId,
                    roleSlots: [
                        {role: 'manager', goalCount: 1},
                        {role: 'volunteer', goalCount: 3, part: "first"},
                        {role: 'volunteer', goalCount: 3, part: "second"}
                    ]
                };
                await fetch('/api/events', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
            }
            alert('Événements de test créés avec succès!');
        } catch (e) {
            console.error("Failed to create test events", e);
            alert('Erreur lors de la création des événements de test');
        }
    }

    const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, {weekStartsOn: 1});
    const endDate = endOfWeek(monthEnd, {weekStartsOn: 1});

    // Calculate how many weeks (rows) are shown in the calendar grid
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
                        className={`flex flex-col border rounded-lg p-1 min-h-0 h-full ${
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
                        <div className="flex-1 text-[10px] text-gray-500 space-y-1 overflow-hidden">
                            {dayEvents.length > 0 ? (
                                dayEvents.map(event => (
                                    <Event key={event.id} event={event}/>
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
                    className="grid grid-cols-7 gap-2 h-full"
                >
                    {days}
                </div>
            );
            days = [];
        }

        return (
            <div
                className="grid gap-2 h-full"
                style={{gridTemplateRows: `repeat(${weeksCount}, 1fr)`}}
            >
                {rows}
            </div>
        );
    };

    async function createEvent(data: z.infer<typeof permSchema>) {
        console.log(data)
        try {
            const [startHour, startMinute] = data.startTime.split(":").map(Number)
            const start = setSeconds(
                setMinutes(setHours(new Date(data.startDate), startHour), startMinute),
                0
            )

            const [endHour, endMinute] = data.endTime.split(":").map(Number)
            const end = setSeconds(
                setMinutes(setHours(new Date(data.endDate), endHour), endMinute),
                0
            )

            if (start >= end) {
                toast("Erreur", {
                    description: "La date et l'heure de début doivent être avant celles de fin.",
                })
                return
            }

            const payload = {
                title: "Permanence",
                description: "Permanence",
                start,
                end,
                userId,
                roleSlots: [
                    {role: "manager", goalCount: 1},
                    {role: "volunteer", goalCount: 3, part: "first"},
                    {role: "volunteer", goalCount: 3, part: "second"},
                ],
            }

            const res = await fetch("/api/events", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                throw new Error("Échec de la création de l'événement")
            }

            toast.success("Événement créé !")

            router.refresh()
        } catch (error) {
            toast.error("Erreur lors de la création", {
                description: (
                    <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
                        <code className="text-white">{JSON.stringify(error)}</code>
                    </pre>
                )
            })
        }
    }

    return (
        <div className="h-svh flex flex-col pt-16 px-6 pb-6 min-h-0">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                        <ChevronLeft className="h-5 w-5"/>
                    </button>
                    <button onClick={() => setCurrentMonth(new Date())} className="text-xs px-2 py-1 rounded border">
                        Aujourd’hui
                    </button>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <ChevronRight className="h-5 w-5"/>
                    </button>
                </div>
                <Button onClick={createTestEvents}>
                    Générer les événements de test
                </Button>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <CalendarPlus/>
                        </Button>
                    </DialogTrigger>

                    <DialogContent>
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
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50"/>
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
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50"/>
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


                <h2 className="text-xl font-semibold capitalize">
                    {format(currentMonth, 'MMMM yyyy', {locale: fr})}
                </h2>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-700 mb-2 flex-shrink-0">
                {daysOfWeek.map(day => (
                    <div key={day}>{day}</div>
                ))}
            </div>
            <div className="flex flex-col flex-grow min-h-0">
                {renderCells()}
            </div>
        </div>
    );
}
