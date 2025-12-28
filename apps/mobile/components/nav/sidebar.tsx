"use client";
import NavLink from "./link"
import logo from '@/public/logo.svg'
import Image from "next/image";
import {authClient} from "@/lib/auth-client";
import {useRouter} from "next/navigation";
import {UserButton} from "@daveyplate/better-auth-ui";
import {faCalendarDays, faComment, faHouse} from "@fortawesome/free-solid-svg-icons";
import {useEffect} from "react";

export default function Nav() {
    const {data: session, isPending} = authClient.useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/auth/sign-in");
        }
    }, [session, isPending, router]);

    if (isPending || !session) return null;

    return (
        <div className="w-2xs border-e border-main flex flex-col justify-between items-center">
            <div className="w-5/6 flex flex-row items-center gap-6 mt-2">
                <Image src={logo} alt="logo" height={80}/>
                Le Trèfle 2.0
            </div>
            <ul className="flex flex-col w-full">
                <NavLink link='/' name='Accueil' icon={faHouse}/>
                <NavLink link='/chat' name='Permanence' icon={faComment}/>
                <NavLink link='/planning' name='Planning' icon={faCalendarDays}/>
            </ul>
            <UserButton
                className="w-full rounded-none bg-white text-neutral-700 hover:bg-gray-50 border-t-1 border-main"/>
        </div>
    );
}
