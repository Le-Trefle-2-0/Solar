"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Bell, Loader2} from "lucide-react";
import {joinWaitlist} from "@/app/actions/recruitments";
import {toast} from "sonner";
import Link from "next/link";

interface WaitlistFormProps {
    recruitmentId: string;
}

export function WaitlistForm({recruitmentId}: WaitlistFormProps) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        try {
            const result = await joinWaitlist(recruitmentId, email);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Vous avez bien été ajouté à la liste d'attente !");
                setIsSuccess(true);
                setEmail("");
            }
        } catch (error) {
            toast.error("Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-primary/10 p-6 rounded-xl text-center space-y-2 animate-in fade-in zoom-in duration-300">
                <p className="font-semibold text-primary">C'est noté !</p>
                <p className="text-sm text-muted-foreground">
                    Vous recevrez un email dès que ce recrutement sera rouvert.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto">
            <div className="space-y-2">
                <p className="text-sm font-medium">Être prévenu de la réouverture :</p>
                <div className="flex gap-2">
                    <Input
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="rounded-xl"
                    />
                    <Button type="submit" disabled={isLoading} className="rounded-xl px-6">
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin"/>
                        ) : (
                            <>
                                <Bell className="mr-2 h-4 w-4"/>
                                M'inscrire
                            </>
                        )}
                    </Button>
                </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
                En vous inscrivant, vous acceptez que votre email soit utilisé pour vous notifier de la réouverture de
                ce poste. Votre email sera supprimé immédiatement après l'envoi de cette notification.
                Consultez notre <Link href="/confidentialite" className="underline hover:text-primary">politique de
                confidentialité</Link>.
            </p>
        </form>
    );
}
