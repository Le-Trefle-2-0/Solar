'use client';

import {authClient} from "@/lib/auth-client";
import SignOut from "@/components/auth/signout";

export default function Home() {
    const {data: session} = authClient.useSession();

    return (
        <div className="flex flex-col items-center justify-between h-full max-w-2xl">
            <SignOut/>
            <SignOut/>
        </div>
    );
}