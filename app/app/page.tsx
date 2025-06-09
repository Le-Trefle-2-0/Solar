import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import SignOut from "@/components/auth/signout";
import {redirect} from "next/navigation";

export default async function Home() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/auth/signin");
    }

    return (
        <div>
            <main className="flex flex-col gap-3 items-center justify-center p-10">
                <div className="flex gap-3">
                    <SignOut/>
                </div>
                <p>{!session ? "Not authenticated" : session.user.name}</p>
            </main>
        </div>
    );
}