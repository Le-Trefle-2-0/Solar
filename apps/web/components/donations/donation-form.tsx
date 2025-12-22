"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {initiateDonation} from "@/app/actions/donations";
import {toast} from "sonner";
import {cn} from "@/lib/utils";

const PRESET_AMOUNTS = [5, 10, 20, 50];

export function DonationForm() {
    const [isRecurring, setIsRecurring] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState<number | null>(20);
    const [customAmount, setCustomAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const handleDonation = async () => {
        const amount = selectedAmount || parseFloat(customAmount);
        if (!amount || amount <= 0) {
            toast.error("Veuillez sélectionner ou saisir un montant valide.");
            return;
        }

        setLoading(true);
        try {
            const result = await initiateDonation({
                amount,
                isRecurring,
            });

            if (result.error) {
                toast.error(result.error);
            } else if (result.redirectUrl) {
                window.location.href = result.redirectUrl;
            }
        } catch (error) {
            toast.error("Une erreur est survenue lors de l'initialisation du don.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto border-none shadow-xl">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Choisissez votre don</CardTitle>
                <CardDescription>Sélectionnez le type et le montant de votre soutien.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <Tabs defaultValue="one-time" onValueChange={(v) => setIsRecurring(v === "recurring")}
                      className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="one-time">Don ponctuel</TabsTrigger>
                        <TabsTrigger value="recurring">Don mensuel</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="space-y-4">
                    <Label className="text-base font-semibold">Montant du don</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {PRESET_AMOUNTS.map((amount) => (
                            <Button
                                key={amount}
                                variant={selectedAmount === amount ? "default" : "outline"}
                                className={cn(
                                    "h-12 text-lg font-bold transition-all",
                                    selectedAmount === amount ? "scale-105 shadow-md" : ""
                                )}
                                onClick={() => {
                                    setSelectedAmount(amount);
                                    setCustomAmount("");
                                }}
                            >
                                {amount}€
                            </Button>
                        ))}
                    </div>

                    <div className="relative mt-4">
                        <Label htmlFor="custom-amount" className="text-xs text-muted-foreground uppercase mb-1 block">
                            Ou montant personnalisé
                        </Label>
                        <div className="relative">
                            <Input
                                id="custom-amount"
                                type="number"
                                placeholder="Saisissez un montant"
                                value={customAmount}
                                onChange={(e) => {
                                    setCustomAmount(e.target.value);
                                    setSelectedAmount(null);
                                }}
                                className="pl-3 pr-10 h-12 text-lg"
                            />
                            <div
                                className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground font-bold">
                                €
                            </div>
                        </div>
                    </div>
                </div>

                {selectedAmount === 5 && (
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-sm text-center italic">
                        "Votre don de 5€ permet de couvrir les frais de fonctionnement de notre serveur Discord pour une
                        semaine."
                    </div>
                )}
                {selectedAmount === 20 && (
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-sm text-center italic">
                        "Avec 20€, vous financez la formation d'un nouveau bénévole écoutant."
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button
                    size="lg"
                    className="w-full h-14 text-xl font-bold shadow-lg"
                    onClick={handleDonation}
                    disabled={loading || (!selectedAmount && !customAmount)}
                >
                    {loading ? "Chargement..." : isRecurring ? "Commencer mon don mensuel" : "Faire un don maintenant"}
                </Button>
            </CardFooter>
        </Card>
    );
}
