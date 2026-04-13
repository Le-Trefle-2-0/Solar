"use client"
import React, {useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Calendar, Edit, Loader2, Mail, Plus, Send, Trash2} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import {toast} from "sonner";
import {Page} from "@/components/ui";

export default function NewslettersPage() {
    const [newsletters, setNewsletters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchNewsletters = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/v1/newsletters');
            setNewsletters(data);
        } catch (error: any) {
            toast.error("Erreur lors de la récupération des newsletters: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNewsletters();
    }, []);

    const createNewsletter = async () => {
        try {
            const res = await apiFetch('/v1/newsletters', {
                method: 'POST',
                body: JSON.stringify({title: "Nouvelle newsletter", content: ""})
            });
            toast.success("Newsletter créée");
            router.push(`/app/newsletters/${res.id}`);
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        }
    };

    const deleteNewsletter = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette newsletter ?")) return;
        try {
            await apiFetch(`/v1/newsletters/${id}`, {method: 'DELETE'});
            toast.success("Newsletter supprimée");
            fetchNewsletters();
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        }
    };

    return (
        <Page
            title="Gestion des Newsletters"
            description="Créez, éditez et programmez vos communications pour les bénévoles."
        >
            <div className="flex justify-end mb-6">
                <Button onClick={createNewsletter} className="gap-2">
                    <Plus className="h-4 w-4"/> Nouvelle newsletter
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                </div>
            ) : newsletters.length === 0 ? (
                <Card className="border-dashed bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Mail className="h-12 w-12 text-muted-foreground mb-4 opacity-20"/>
                        <p className="text-muted-foreground font-medium">Aucune newsletter pour le moment.</p>
                        <Button variant="link" onClick={createNewsletter}>Créer votre première newsletter</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {newsletters.map((nl) => (
                        <Card key={nl.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div
                                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                            nl.status === 'sent' ? 'bg-green-100 text-green-700' :
                                                nl.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {nl.status === 'sent' ? 'Envoyée' : nl.status === 'scheduled' ? 'Programmée' : 'Brouillon'}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                                onClick={() => deleteNewsletter(nl.id)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="mt-2 line-clamp-1">{nl.title}</CardTitle>
                                <CardDescription>
                                    Modifiée le {format(new Date(nl.updatedAt), "PPp", {locale: fr})}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <Edit
                                            className="h-3.5 w-3.5"/> Par {nl.author?.displayUsername || nl.author?.name || 'Inconnu'}
                                    </div>
                                    {nl.scheduledAt && (
                                        <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                                            <Calendar className="h-3.5 w-3.5"/> Prévue pour
                                            le {format(new Date(nl.scheduledAt), "PPp", {locale: fr})}
                                        </div>
                                    )}
                                    {nl.sentAt && (
                                        <div className="flex items-center gap-1.5 text-green-600">
                                            <Send className="h-3.5 w-3.5"/> Envoyée
                                            le {format(new Date(nl.sentAt), "PPp", {locale: fr})}
                                        </div>
                                    )}
                                </div>
                                <Link href={`/app/newsletters/${nl.id}`}>
                                    <Button className="w-full">
                                        {nl.status === 'sent' ? 'Consulter' : 'Éditer'}
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </Page>
    );
}
