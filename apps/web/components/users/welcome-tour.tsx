"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {completeOnboardingAction} from "@/app/actions/onboarding";
import type {TourStep} from "@/lib/onboarding";

/** Short tour of the application, shown until it is finished or closed once (#82). */
export function WelcomeTour({steps, needsTwoFactor}: { steps: TourStep[]; needsTwoFactor: boolean }) {
    const router = useRouter();
    const [open, setOpen] = useState(true);
    const [index, setIndex] = useState(0);
    const step = steps[index];
    const last = index === steps.length - 1;

    function close() {
        setOpen(false);
        // A failure only means the tour comes back at the next visit
        void completeOnboardingAction();
    }

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) close(); }}>
            <DialogContent className="max-w-[95vw] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{step.title}</DialogTitle>
                    <DialogDescription>{step.text}</DialogDescription>
                </DialogHeader>
                <p className="text-xs text-muted-foreground" aria-live="polite">Étape {index + 1} sur {steps.length}</p>
                <DialogFooter className="gap-2">
                    {index > 0
                        ? <Button variant="outline" onClick={() => setIndex(index - 1)}>Précédent</Button>
                        : <Button variant="ghost" onClick={close}>Passer la visite</Button>}
                    {last && needsTwoFactor && (
                        <Button variant="outline" onClick={() => { close(); router.push("/app/settings"); }}>
                            Activer maintenant
                        </Button>
                    )}
                    <Button onClick={() => last ? close() : setIndex(index + 1)}>{last ? "Terminer" : "Suivant"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
