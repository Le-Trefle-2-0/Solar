"use server";
import NavLink from "./link"
import logo from '@/public/logo.svg'
import Image from "next/image";
import {auth} from "@/lib/auth"; // path to your Better Auth server instance
import {headers} from "next/headers";
import {redirect} from "next/navigation";

export default async function Nav() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return redirect("/auth/signin");
    return (
        <div className="w-3xs border-e border-main flex flex-col justify-between items-center">
            <div className="w-5/6 flex flex-row items-center gap-6 mt-2">
                <Image src={logo} alt="logo" height={80}/>
                Le Trèfle 2.0
            </div>
            <ul className="flex flex-col w-full">
                <NavLink link='/app' name='Accueil' icon='none'/>
                <NavLink link='/dashboard' name='Dashboard' icon='none'/>
                <NavLink link='/admin' name='Admin' icon='none'/>
            </ul>
            <div>{session.user.name}</div>
        </div>
    );
}
