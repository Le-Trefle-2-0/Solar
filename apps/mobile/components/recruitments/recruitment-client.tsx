"use client";

import {useState} from "react";
import {Recruitment} from "@prisma/client";
import {Button} from "@/components/ui/button";
import * as Icons from "lucide-react";
import {Edit, Plus, Trash2, Users} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {RecruitmentDialog} from "./recruitment-dialog";
import {apiFetch} from "@/lib/api";
import {toast} from "sonner";
import {Badge} from "@/components/ui/badge";

interface RecruitmentClientProps {
    initialData: Recruitment[];
}

export function RecruitmentClient({initialData}: RecruitmentClientProps) {
    const [recruitments, setRecruitments] = useState<Recruitment[]>(initialData);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRecruitment, setEditingRecruitment] = useState<Recruitment | null>(null);

    const handleAdd = () => {
        setEditingRecruitment(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (recruitment: Recruitment) => {
        setEditingRecruitment(recruitment);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce recrutement ?")) return;

        try {
            await apiFetch(`/v1/recruitments/${id}`, {method: 'DELETE'});
            toast.success("Recrutement supprimé");
            setRecruitments(recruitments.filter((r) => r.id !== id));
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const handleSave = (recruitment: Recruitment) => {
        if (editingRecruitment) {
            setRecruitments(recruitments.map((r) => (r.id === recruitment.id ? recruitment : r)));
        } else {
            setRecruitments([recruitment, ...recruitments]);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4"/> Publier un recrutement
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recruitments.map((recruitment) => {
                    const Icon = (Icons as any)[recruitment.icon || "Users"] || Icons.Users;
                    return (
                        <Card key={recruitment.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <Icon className="h-5 w-5"/>
                                        </div>
                                        <div className="flex flex-col">
                                            <CardTitle className="line-clamp-1">{recruitment.title}</CardTitle>
                                            <div className="mt-1">
                                                {recruitment.enabled ? (
                                                    <Badge variant="default"
                                                           className="bg-primary/20 text-primary border-primary/20 hover:bg-primary/30 text-[10px] py-0 h-4">Actif</Badge>
                                                ) : (
                                                    <Badge variant="destructive"
                                                           className="bg-destructive/20 text-destructive border-destructive/20 hover:bg-destructive/30 text-[10px] py-0 h-4">Inactif</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(recruitment)}>
                                            <Edit className="h-4 w-4"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(recruitment.id)}
                                                className="text-destructive">
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>
                                <CardDescription className="line-clamp-2 mt-2">
                                    {recruitment.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="text-xs text-muted-foreground">
                                    Créé le {new Date(recruitment.createdAt).toLocaleDateString()}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {recruitments.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-20"/>
                        <h3 className="mt-4 text-lg font-semibold">Aucun recrutement publié</h3>
                        <p className="text-muted-foreground">Commencez par en créer un nouveau.</p>
                        <Button variant="outline" className="mt-4" onClick={handleAdd}>
                            <Plus className="mr-2 h-4 w-4"/> Nouveau recrutement
                        </Button>
                    </div>
                )}
            </div>

            <RecruitmentDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                recruitment={editingRecruitment}
                onSave={handleSave}
            />
        </div>
    );
}
