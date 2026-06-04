"use client";

import React, {useState} from "react";
import {Button, Card, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui";
import {apiFetch} from "@/lib/api";
import {toast} from "sonner";
import {CheckCircle2} from "lucide-react";

interface FeedbackFormProps {
    ticketID: number;
    onSubmitted?: () => void;
}

export function FeedbackForm({ticketID, onSubmitted}: FeedbackFormProps) {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({
        age: "",
        feeling: "",
        gender: "",
        previouslyOpened: "",
        previouslyAtTrefle: "",
        location: "",
        region: "",
    });

    const regions = [
        "Auvergne-Rhone-Alpes", "Bourgogne-Franche-Compté", "Bretagne", "Centre-Val de Loire",
        "Corse", "Grand Est", "Hauts de France", "Ile-de-France", "Normandie",
        "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Cote d'Azur", "Outres-Mers"
    ];

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await apiFetch("/v1/tickets/submit-feedback", {
                method: "POST",
                body: JSON.stringify({
                    ticketID,
                    feedback
                })
            });
            setSubmitted(true);
            toast.success("Merci pour votre retour !");
            if (onSubmitted) onSubmitted();
        } catch (error) {
            console.error("Failed to submit feedback", error);
            toast.error("Une erreur est survenue lors de l'envoi du formulaire.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-500"/>
                <h3 className="text-xl font-semibold">Merci beaucoup !</h3>
                <p className="text-muted-foreground">Vos réponses nous aident à améliorer notre service et à mieux
                    comprendre vos besoins.</p>
            </div>
        );
    }

    return (
        <Card className="p-6 space-y-6 max-w-2xl mx-auto my-8 border-dashed">
            <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold italic text-primary">Comment s'est passée votre écoute ?</h3>
                <p className="text-sm text-muted-foreground">Ce formulaire est facultatif et anonyme. Vous pouvez
                    répondre à tout ou partie des questions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Quel est votre âge ?</Label>
                    <Select onValueChange={(v) => setFeedback({...feedback, age: v})}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choisir..."/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="<12">Moins de 12 ans</SelectItem>
                            <SelectItem value="12-14">12-14 ans</SelectItem>
                            <SelectItem value="15-18">15-18 ans</SelectItem>
                            <SelectItem value="19-25">19-25 ans</SelectItem>
                            <SelectItem value=">25">Plus de 25 ans</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Vous sentez-vous mieux suite à cette écoute ?</Label>
                    <Select onValueChange={(v) => setFeedback({...feedback, feeling: v})}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choisir..."/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Oui vraiment">Oui vraiment</SelectItem>
                            <SelectItem value="un peu">Un peu</SelectItem>
                            <SelectItem value="moyennement">Moyennement</SelectItem>
                            <SelectItem value="pas vraiment">Pas vraiment</SelectItem>
                            <SelectItem value="pas du tout">Pas du tout</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>De quel genre êtes-vous ?</Label>
                    <Select onValueChange={(v) => setFeedback({...feedback, gender: v})}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choisir..."/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Homme">Homme</SelectItem>
                            <SelectItem value="Femme">Femme</SelectItem>
                            <SelectItem value="Autre">Autre</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Avez-vous déjà ouvert une écoute avant ?</Label>
                    <Select onValueChange={(v) => setFeedback({...feedback, previouslyOpened: v})}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choisir..."/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Oui">Oui</SelectItem>
                            <SelectItem value="Non">Non</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {feedback.previouslyOpened === "Oui" && (
                    <div className="space-y-2">
                        <Label>Était-ce chez Le Trèfle 2.0 ?</Label>
                        <Select onValueChange={(v) => setFeedback({...feedback, previouslyAtTrefle: v})}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choisir..."/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Oui">Oui</SelectItem>
                                <SelectItem value="Non">Non</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Où vous situez-vous ?</Label>
                    <Select onValueChange={(v) => setFeedback({...feedback, location: v})}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choisir..."/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="France">En France</SelectItem>
                            <SelectItem value="Autre pays Francophone">Autre pays Francophone</SelectItem>
                            <SelectItem value="Autre">Autre...</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {feedback.location === "France" && (
                    <div className="space-y-2">
                        <Label>Dans quelle région êtes-vous ?</Label>
                        <Select onValueChange={(v) => setFeedback({...feedback, region: v})}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choisir une région"/>
                            </SelectTrigger>
                            <SelectContent>
                                {regions.map(r => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90"
                >
                    {loading ? "Envoi..." : "Envoyer mes réponses"}
                </Button>
            </div>
        </Card>
    );
}
