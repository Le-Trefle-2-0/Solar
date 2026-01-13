"use client"
import React, {useState} from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Calendar} from "@/components/ui/calendar";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import {CalendarIcon} from "lucide-react";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {cn} from "@/lib/utils";

interface SendConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    sending: boolean;
}

export function SendConfirmationDialog({open, onOpenChange, onConfirm, sending}: SendConfirmationDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer l'envoi</AlertDialogTitle>
                    <AlertDialogDescription>
                        Voulez-vous vraiment envoyer cette newsletter à tous les bénévoles inscrits ? Cette action est
                        irréversible.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={sending}>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={sending}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {sending ? "Envoi en cours..." : "Confirmer l'envoi"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

interface ScheduleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSchedule: (date: Date) => void;
    saving: boolean;
}

export function ScheduleDialog({open, onOpenChange, onSchedule, saving}: ScheduleDialogProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState("12:00");

    const handleSchedule = () => {
        if (!date) return;
        const [hours, minutes] = time.split(":").map(Number);
        const scheduledDate = new Date(date);
        scheduledDate.setHours(hours, minutes);
        onSchedule(scheduledDate);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Programmer la newsletter</DialogTitle>
                    <DialogDescription>
                        Choisissez la date et l'heure auxquelles vous souhaitez que cette newsletter soit envoyée.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Date d'envoi</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4"/>
                                    {date ? format(date, "PPP", {locale: fr}) : <span>Choisir une date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    locale={fr}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="time">Heure d'envoi</Label>
                        <Input
                            id="time"
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Annuler
                    </Button>
                    <Button onClick={handleSchedule} disabled={!date || saving}>
                        {saving ? "Programmation..." : "Programmer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
