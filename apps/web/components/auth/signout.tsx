"use client";

import {signOutEverywhere} from "@/lib/sign-out";
import {useRouter} from "next/navigation";

export default function SignoutButton() {
    const router = useRouter();
    return (
        <button
            className="bg-neutral-700 text-white p-2 rounded-md"
            onClick={() => signOutEverywhere(() => router.push("/auth/signin"))}
        >
            Déconnexion
        </button>
    );
}