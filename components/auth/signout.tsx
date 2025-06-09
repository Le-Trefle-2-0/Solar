"use client";

import { authClient } from "@/lib/auth-client";
import {useRouter} from "next/navigation";

export default function SignoutButton() {
    const router = useRouter();
    return (
        <button
            className="bg-neutral-700 text-white p-2 rounded-md"
            onClick={async () => await authClient.signOut({
                fetchOptions: {
                    onSuccess: () => {
                        router.push("/auth/signin");
                    },
                },
            })}
        >
            Déconnexion
        </button>
    );
}