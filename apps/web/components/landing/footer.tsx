"use client";

import Link from "next/link";
import Image from "next/image";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useState} from "react";
import {subscribeToNewsletter} from "@/app/actions/newsletter";
import {toast} from "sonner";
import {Loader2} from "lucide-react";

export function PublicFooter() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            const result = await subscribeToNewsletter(email);
            if (result.success) {
                toast.success("Vous êtes maintenant inscrit à notre newsletter !");
                setEmail("");
            } else {
                toast.error(result.error || "Une erreur est survenue");
            }
        } catch (error) {
            toast.error("Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <footer className="border-t bg-background w-full">
            <div className="px-4 md:px-8 py-12 md:py-24 w-full">
                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="flex flex-col gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <Image src="/logo.svg" alt="Le Trèfle 2.0" width={32} height={32}/>
                            <span className="text-xl font-semibold font-barlow">Le Trèfle 2.0</span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            324, chemin de Goulsou<br/>
                            30120 Le Vigan<br/>
                            RNA : W30 300 5428
                        </p>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold font-barlow">Newsletter</h3>
                        <p className="text-sm text-muted-foreground">S'inscrire à notre lettre d'actualité</p>
                        <form className="flex gap-2" onSubmit={handleSubmit}>
                            <Input
                                placeholder="Adresse courriel"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : "S'inscrire"}
                            </Button>
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
