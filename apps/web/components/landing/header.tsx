"use client";

import Link from "next/link";
import {Button} from "@/components/ui/button";
import Image from "next/image";
import {useState} from "react";
import {ContactDialog} from "./contact-dialog";
import {Menu, UserPlus, Mail} from "lucide-react";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,} from "@/components/ui/sheet";

export function PublicHeader({session}: { session: any }) {
    const [contactOpen, setContactOpen] = useState(false);

    const NavItems = ({className = ""}: { className?: string }) => {
        const isMobile = className.includes("flex-col");
        const linkBase = isMobile
            ? "block w-full py-3 px-4 rounded-md transition-colors text-foreground text-left bg-transparent hover:bg-muted/50"
            : "transition-colors hover:text-foreground/80 text-foreground/60";

        return (
            <div className={className}>
                <Link href="/benevoles" className={`${linkBase} flex items-center gap-3`}>
                    {isMobile && <UserPlus className="h-5 w-5 text-foreground/80" />}
                    <span>Devenir bénévole</span>
                </Link>
                <button
                    onClick={() => setContactOpen(true)}
                    className={`${linkBase} cursor-pointer flex items-center gap-3`}
                >
                    {isMobile && <Mail className="h-5 w-5 text-foreground/80" />}
                    <span>Contact</span>
                </button>
                <div className={isMobile ? "px-4" : ""}>
                    <Button asChild variant="default" className="w-full lg:w-auto">
                        <Link href="/don">Faire un don</Link>
                    </Button>
                </div>
                <div className={isMobile ? "px-4" : ""}>
                    {session ? (
                        <Button asChild variant="outline" className="w-full lg:w-auto">
                            <Link href="/app">Espace Bénévole</Link>
                        </Button>
                    ) : (
                        <Button asChild variant="outline" className="w-full lg:w-auto">
                            <Link href="/auth/sign-in">Connexion Bénévole</Link>
                        </Button>
                    )}
                </div>
            </div>
        );
    };

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
                        <SheetContent side="right" className="sm:w-[400px] sm:h-auto">
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
