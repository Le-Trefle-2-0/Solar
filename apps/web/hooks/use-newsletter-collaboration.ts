"use client"
import * as Y from "yjs";
import {useEffect} from "react";
import {useSocket} from "@/context/Socket";

export function useNewsletterCollaboration(newsletterId: string, doc: Y.Doc) {
    const {socket} = useSocket();

    useEffect(() => {
        if (!socket || !newsletterId) return;

        socket.emit('join-newsletter', newsletterId);

        const handleUpdate = (update: Uint8Array) => {
            Y.applyUpdate(doc, new Uint8Array(update));
        };

        socket.on('newsletter-update', handleUpdate);

        const onDocUpdate = (update: Uint8Array) => {
            socket.emit('newsletter-sync', {
                id: newsletterId,
                update: Array.from(update) // Convert to array for JSON serialization
            });
        };

        doc.on('update', onDocUpdate);

        return () => {
            socket.emit('leave-newsletter', newsletterId);
            socket.off('newsletter-update', handleUpdate);
            doc.off('update', onDocUpdate);
        };
    }, [socket, newsletterId, doc]);
}
