'use client';

import {useEffect, useState} from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import EventModal from '@/components/ui/modals/event';
import type {EventData} from "@/lib/interface";

export default function PlanningPage() {
    const [events, setEvents] = useState<EventData[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/events');
            const data = await res.json();
            setEvents(data.events || []);
        } catch (e) {
            console.error('Failed to fetch events', e);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleEventClick = (info: any) => {
        const eventId = info.event.id;
        const event = events.find((e) => e.id === eventId);
        if (event) {
            setSelectedEvent(event);
            setModalOpen(true);
        }
    };

    const handleEventUpdate = (updated: EventData) => {
        setEvents((prev) =>
            prev.map((e) => (e.id === updated.id ? updated : e))
        );
    };

    return (
        <main className="p-6">
            <h1 className="text-2xl font-bold mb-4">Planning</h1>

            <div className="bg-white p-4 rounded-lg shadow-md">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={events.map((event) => ({
                        id: event.id,
                        title: event.title,
                        start: event.start,
                        end: event.end,
                    }))}
                    eventClick={handleEventClick}
                    height="auto"
                />
            </div>

            <EventModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                event={selectedEvent}
                onUpdate={handleEventUpdate}
            />
        </main>
    );
}
