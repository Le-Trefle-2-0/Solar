'use client';

import {useEffect, useState} from 'react';
import type {EventData} from "@/lib/interface";
import PlanningCalendar from "@/components/calendar";
import {useSession} from "@/lib/auth-client"; // adjust if needed
import {apiFetch} from "@/lib/api";
import {Page} from "@/components/ui";

export default function PlanningPage() {
    const [events, setEvents] = useState<EventData[]>([]);
    const {data: session} = useSession();

    const fetchEvents = async () => {
        try {
            const data = await apiFetch('/v1/events');
            setEvents(data.events || data || []);
        } catch (e) {
            console.error('Failed to fetch events', e);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    return (
        <Page title="Planning" description="Consultez et inscrivez-vous aux sessions d'écoute" className="p-0"
              containerClassName="overflow-y-hidden">
            <PlanningCalendar
                events={events}
                userId={session?.user?.id}
            />
        </Page>
    );
}
