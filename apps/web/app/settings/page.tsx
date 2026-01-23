"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

export default function SettingsRedirect() {
    const router = useRouter();
    useEffect(() => {
        // Replace current history entry with new path so back behaves as expected
        router.replace('/app/settings');
    }, [router]);

    return null;
}