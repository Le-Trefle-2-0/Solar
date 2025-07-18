'use client';

import {useEffect, useState} from 'react';
import type {EventData} from "@/lib/interface";
import PlanningCalendar from "@/components/calendar";
import {useSession} from "@/lib/auth-client"; // adjust if needed

export default function PlanningPage() {
    const [events, setEvents] = useState<EventData[]>([]);
    const {data: session} = useSession();

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

    return (
        <PlanningCalendar
            events={events}
            userId={session?.user?.id}
        />
    );
}
