"use client";

import Link from "next/link";
import {Button} from "@/components/ui/button";
import Image from "next/image";
import {useState} from "react";
import {ContactDialog} from "./contact-dialog";

export function PublicHeader({session}: { session: any }) {
    const [contactOpen, setContactOpen] = useState(false);

    return (
        <header
            className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-4 md:px-8 w-full">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.svg" alt="Le Trèfle 2.0" width={40} height={40}/>
                        <span className="text-xl font-bold hidden sm:inline-block">Le Trèfle 2.0</span>
                    </Link>
                </div>
                <nav className="flex items-center gap-6 text-sm font-medium">
                    <Link href="/benevoles" className="transition-colors hover:text-foreground/80 text-foreground/60">Devenir
                        bénévole</Link>
                    <button
                        onClick={() => setContactOpen(true)}
                        className="transition-colors hover:text-foreground/80 text-foreground/60 cursor-pointer"
                    >
                        Contact
                    </button>
                    {session ? (
                        <Button asChild variant="outline">
                            <Link href="/app">Ouvrir l'application</Link>
                        </Button>
                    ) : (
                        <Button asChild variant="outline">
                            <Link href="/login">Connexion</Link>
                        </Button>
                    )}
                    <Button asChild variant="default">
                        <Link href="/don">Faire un don</Link>
                    </Button>
                </nav>
            </div>
            <ContactDialog open={contactOpen} onOpenChange={setContactOpen}/>
        </header>
    );
}
