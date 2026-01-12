import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import SignOut from "@/components/auth/signout";

import {constructMetadata} from "@/lib/metadata";

export const metadata = constructMetadata({
    title: "Tableau de bord",
    noIndex: true,
});

export default async function Home() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="flex flex-col items-center justify-between h-full max-w-2xl">
            <SignOut/>
            <SignOut/>
        </div>
    );
}