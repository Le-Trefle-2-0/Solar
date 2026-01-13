'use client';

import {useEffect, useState} from "react";
import {Chat} from "@/components/chat";
import {useSearchParams} from "next/navigation";
import {apiFetch} from "@/lib/api";

export default function TicketChat() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        apiFetch(`/v1/tickets/channel/${id}`)
            .then(setTicket)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="flex h-screen w-full items-center justify-center">Chargement...</div>;
    if (!ticket) return <div className="flex h-screen w-full items-center justify-center">Ticket non trouvé</div>;

    return (
        <Chat channelID={id as string} statusID={ticket.status.id as number}/>
    );
}