"use client";

import Link from "next/link";
import {Button} from "@/components/ui/button";
import Image from "next/image";
import {useState} from "react";
import {ContactDialog} from "./contact-dialog";
import {Menu} from "lucide-react";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,} from "@/components/ui/sheet";

export function PublicHeader({session}: { session: any }) {
    const [contactOpen, setContactOpen] = useState(false);

    const NavItems = ({className = ""}: { className?: string }) => (
        <div className={className}>
            <Link href="/benevoles" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Devenir bénévole
            </Link>
            <button
                onClick={() => setContactOpen(true)}
                className="transition-colors hover:text-foreground/80 text-foreground/60 cursor-pointer text-left"
            >
                Contact
            </button>
            <Button asChild variant="default" className="w-full lg:w-auto">
                <Link href="/don">Faire un don</Link>
            </Button>
            {session ? (
                <Button asChild variant="outline" className="w-full lg:w-auto">
                    <Link href="/app">Ouvrir Solar</Link>
                </Button>
            ) : (
                <Button asChild variant="outline" className="w-full lg:w-auto">
                    <Link href="/auth/sign-in">Connexion Bénévole</Link>
                </Button>
            )}
        </div>
    );

    return (
        <header
            className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-in fade-in duration-1000">
            <div className="flex h-16 items-center justify-between px-4 md:px-8 w-full">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.svg" alt="Le Trèfle 2.0" width={40} height={40}/>
                        <span className="text-xl font-bold hidden sm:inline-block">Le Trèfle 2.0</span>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
                    <NavItems className="flex items-center gap-6"/>
                </nav>

                {/* Mobile Navigation */}
                <div className="lg:hidden flex items-center">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10">
                                <Menu className="h-6 w-6"/>
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                            <SheetHeader className="text-left">
                                <SheetTitle className="flex items-center gap-2">
                                    <Image src="/logo.svg" alt="Le Trèfle 2.0" width={32} height={32}/>
                                    Le Trèfle 2.0
                                </SheetTitle>
                            </SheetHeader>
                            <nav className="mt-8">
                                <NavItems className="flex flex-col gap-6 text-lg font-medium"/>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
            <ContactDialog open={contactOpen} onOpenChange={setContactOpen}/>
        </header>
    );
}
