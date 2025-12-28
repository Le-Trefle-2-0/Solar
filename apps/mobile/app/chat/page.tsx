'use client';

import {useEffect, useState} from "react";
import {Chat} from "@/components/chat";
import {apiFetch} from "@/lib/api";

export default function MainChat() {
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/v1/events/latest')
            .then(setEvent)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex h-screen w-full items-center justify-center">Chargement...</div>;

    if (event) {
        return (
            <Chat channelID={event.channelID} statusID={0}/>
        )
    }

    return (
        <div className="flex justify-center items-center w-full h-svh">
            <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
                Aucune permanence en cours ni programmée
            </h1>
        </div>
    );
}
