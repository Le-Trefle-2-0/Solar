"use server";
import NavLink from "./link"
import logo from '@/public/logo.svg'
import Image from "next/image";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {UserButton} from "@daveyplate/better-auth-ui";
import {faCalendarDays, faComment, faHouse} from "@fortawesome/free-solid-svg-icons";
import prisma from "@/lib/prisma";

export default async function Nav() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const tickets = await prisma.ticket.findMany()

    if (!session) return redirect("/auth/sign-in");
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
                {/*{tickets.map(ticket => (*/}
                {/*    <NavLink key={ticket.id} link={`/app/ticket/${ticket.channelId}`} name={ticket.channelName} icon={faEarListen} />*/}
                {/*))}*/}
            </ul>
            <UserButton
                className="w-full rounded-none bg-white text-neutral-700 hover:bg-gray-50 border-t-1 border-main"/>
        </div>
    );
}
