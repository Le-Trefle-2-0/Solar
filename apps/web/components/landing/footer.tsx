import Link from "next/link";
import Image from "next/image";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

export function PublicFooter() {
    return (
        <footer className="border-t bg-background w-full">
            <div className="px-4 md:px-8 py-12 md:py-24 w-full">
                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="flex flex-col gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <Image src="/logo.svg" alt="Le Trèfle 2.0" width={32} height={32}/>
                            <span className="text-xl font-bold">Le Trèfle 2.0</span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            324, chemin de Goulsou<br/>
                            30120 Le Vigan<br/>
                            RNA : W30 300 5428
                        </p>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold">Newsletter</h3>
                        <p className="text-sm text-muted-foreground">S'inscrire à notre lettre d'actualité</p>
                        <form className="flex gap-2">
                            <Input placeholder="Adresse courriel" type="email"/>
                            <Button type="submit">S'inscrire</Button>
                        </form>
                    </div>
                    <div className="flex flex-col gap-4 lg:items-end">
                        <nav className="flex flex-col gap-2 text-sm">
                            <Link href="/faq" className="hover:underline">F.A.Q.</Link>
                            <Link href="/confidentialite" className="hover:underline">Confidentialité</Link>
                            <Link href="/legal" className="hover:underline">Mentions Légales</Link>
                            <Link href="/don" className="text-primary font-semibold hover:underline">Faire un don</Link>
                        </nav>
                    </div>
                </div>
            </div>
            <div className="border-t py-8 text-center text-sm text-muted-foreground w-full">
                <p suppressHydrationWarning>© {new Date().getFullYear()} Le Trèfle 2.0. Tous droits réservés.</p>
            </div>
        </footer>
    );
}
