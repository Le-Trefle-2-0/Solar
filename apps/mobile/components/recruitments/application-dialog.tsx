"use client";

import {useState} from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {ApplicationForm} from "./application-form";
import type {RecruitmentField} from "@/lib/recruitments";
import {Send} from "lucide-react";

interface ApplicationDialogProps {
    recruitmentId: string;
    recruitmentTitle: string;
    fields: RecruitmentField[];
}

export function ApplicationDialog({recruitmentId, recruitmentTitle, fields}: ApplicationDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg"
                        className="w-full sm:w-auto font-bold text-lg py-6 px-10 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                    <Send className="mr-2 h-5 w-5"/> Postuler maintenant
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Postuler pour : {recruitmentTitle}</DialogTitle>
                    <DialogDescription>
                        Remplissez le formulaire ci-dessous pour nous envoyer votre candidature.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <ApplicationForm
                        recruitmentId={recruitmentId}
                        fields={fields}
                        onSuccess={() => setOpen(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
