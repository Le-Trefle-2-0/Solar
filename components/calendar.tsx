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
    startOfMonth,
    startOfWeek,
    subMonths
} from 'date-fns';
import {fr} from 'date-fns/locale/fr';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import Event from './event';
import {EventData} from "@/lib/interface";

export default function PlanningCalendar({events, userId}: { events: EventData[], userId?: string }) {
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

    return (
        <div className="h-screen flex flex-col pt-16 px-6 pb-6 min-h-0">
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
                <button
                    onClick={createTestEvents}
                    className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 transition"
                >
                    Générer les événements de test
                </button>
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
