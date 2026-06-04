"use server";
import NavLink from "./link"
import logo from '@/public/logo.svg'
import Image from "next/image";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {UserButton} from "@daveyplate/better-auth-ui";
import {faCalendarDays, faChartLine, faComment, faHouse} from "@fortawesome/free-solid-svg-icons";

export default async function Nav() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) return redirect("/auth/sign-in");

    const userRoles = ((session.user as any).role || "").split(",").map((r: string) => r.trim());
    const isAdmin = userRoles.includes("admin") || userRoles.includes("manager");

    return (
        <div className="w-2xs border-e border-main flex flex-col justify-between items-center">
            <div className="w-5/6 flex flex-row items-center gap-6 mt-2">
                <Image src={logo} alt="logo" height={80}/>
                Le Trèfle 2.0
            </div>
            <ul className="flex flex-col w-full">
                <NavLink link='/app' name='Accueil' icon={faHouse}/>
                <NavLink link='/app/chat' name='Permanence' icon={faComment}/>
                <NavLink link='/app/planning' name='Planning' icon={faCalendarDays}/>
                <NavLink link='/app/admin/stats' name='Statistiques' icon={faChartLine}/>
            </ul>
            <UserButton
                className="w-full rounded-none bg-white text-neutral-700 hover:bg-gray-50 border-t-1 border-main"/>
        </div>
    );
}
