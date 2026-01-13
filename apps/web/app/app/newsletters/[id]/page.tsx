"use client"
import React, {useCallback, useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api";
import {Loader2} from "lucide-react";
import {toast} from "sonner";
import dynamic from "next/dynamic";

// Dynamically import the editor inner component to avoid SSR issues with BlockNote
const NewsletterEditorInner = dynamic(() => import("@/components/newsletters/newsletter-editor-inner"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
        </div>
    )
});

export default function NewsletterDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [newsletter, setNewsletter] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [volunteerCount, setVolunteerCount] = useState<number>(0);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fetchNewsletter = useCallback(async () => {
        try {
            const data = await apiFetch(`/v1/newsletters/${id}`);
            setNewsletter(data);
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
            router.push("/app/newsletters");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    const fetchVolunteerCount = useCallback(async () => {
        try {
            const data = await apiFetch('/v1/newsletters/volunteers/count');
            setVolunteerCount(data.count);
        } catch (e) {
            console.error("Failed to fetch volunteer count", e);
        }
    }, []);

    useEffect(() => {
        if (isMounted) {
            fetchNewsletter();
            fetchVolunteerCount();
        }
    }, [id, isMounted, fetchNewsletter, fetchVolunteerCount]);

    if (!isMounted || loading) return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
        </div>
    );

    if (!newsletter) return null;

    return (
        <NewsletterEditorInner
            id={id}
            initialNewsletter={newsletter}
            volunteerCount={volunteerCount}
        />
    );
}
