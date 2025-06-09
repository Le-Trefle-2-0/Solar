import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import SignOut from "@/components/auth/signout";
import { authClient } from "@/lib/auth-client";

export default async function Dashboard() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return <div>Not logged in</div>;
    }
    return <main className="flex flex-col gap-3 items-center justify-center p-10">
        <div className="flex gap-3">
            <SignOut />
        </div>
        <p>{session.user.name}</p>
    </main>;
}