"use client";

import React, {useEffect, useRef, useState} from "react";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import {Check, ChevronsUpDown, FileText, NotebookTabs} from "lucide-react";
import {apiFetch} from "@/lib/api";
import {
    Badge,
    Button,
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Skeleton
} from "@/components/ui";
import {Message} from "@/components/message";
import {useSession} from "@/lib/auth-client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {cn} from "@/lib/utils";
import {toast} from "sonner";

interface HistoryChatProps {
    channelId: string;
}

export function HistoryChat({channelId}: HistoryChatProps) {
    const {data: session} = useSession();
    const [ticket, setTicket] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTransmission, setShowTransmission] = useState(false);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ticketRes, messagesRes, settingsRes] = await Promise.all([
                    apiFetch(`/v1/tickets/findBy/channelID`, {
                        method: 'POST',
                        body: JSON.stringify({channelID: channelId})
                    }),
                    apiFetch(`/v1/messages/${channelId}?limit=1000`),
                    apiFetch('/v1/admin/settings')
                ]);

                if (ticketRes.success) {
                    setTicket(ticketRes.ticket);
                }
                setMessages(messagesRes);
                if (settingsRes.settings) {
                    const monitoringCategories = settingsRes.settings.find((s: any) => s.key === 'monitoring_categories');
                    if (monitoringCategories) {
                        setAvailableCategories(JSON.parse(monitoringCategories.value));
                    }
                }
            } catch (e: any) {
                console.error("Failed to fetch history data", e);
                toast.error(`Erreur de chargement: ${e.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [channelId]);

    useEffect(() => {
        if (!loading && messages.length > 0 && messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [loading, messages, showTransmission]);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + "h " : ""}${m > 0 ? m + "m " : ""}${s}s`;
    };

    const downloadPDF = () => {
        if (!ticket) return;

        const doc = new jsPDF();
        const userName = session?.user?.displayUsername || session?.user?.name || "Anonyme";
        const title = `Transcript Écoute #${ticket.id}`;
        const dateStr = format(new Date(ticket.createdAt), "d MMMM yyyy HH:mm", {locale: fr});

        let durationSeconds = 0;
        if (messages.length >= 2) {
            const first = new Date(messages[0].timestamp || messages[0].createdAt);
            const last = new Date(messages[messages.length - 1].timestamp || messages[messages.length - 1].createdAt);
            durationSeconds = Math.floor((last.getTime() - first.getTime()) / 1000);
        } else {
            durationSeconds = Math.floor((new Date(ticket.updatedAt).getTime() - new Date(ticket.createdAt).getTime()) / 1000);
        }
        const duration = durationSeconds;

        // --- Page de garde (Front Page) ---
        doc.setFontSize(22);
        doc.setTextColor(140, 192, 136); // Color matching the theme
        doc.text("DOCUMENT CONFIDENTIEL", 105, 80, {align: "center"});

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(title, 105, 100, {align: "center"});

        doc.setFontSize(12);
        doc.text(`Généré par : ${userName}`, 105, 120, {align: "center"});
        doc.text(`Date de génération : ${format(new Date(), "d MMMM yyyy HH:mm", {locale: fr})}`, 105, 130, {align: "center"});

        doc.setTextColor(255, 0, 0);
        doc.setFontSize(14);
        doc.text("LA REPRODUCTION DE CE DOCUMENT EST STRICTEMENT INTERDITE", 105, 160, {align: "center"});

        doc.setTextColor(100);
        doc.setFontSize(10);
        const warningText = "Ce document contient des informations sensibles et confidentielles. " +
            "Son accès est réservé aux personnes autorisées. Toute divulgation non autorisée contrevient au principe de confidentialité et de secret professionnel.";
        const splitWarning = doc.splitTextToSize(warningText, 150);
        doc.text(splitWarning, 105, 180, {align: "center"});

        doc.addPage();

        // --- Page de contenu ---
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);

        doc.text(`Date: ${dateStr}`, 14, 30);
        doc.text(`Durée: ${formatDuration(duration)}`, 14, 35);

        const tableData = messages.map(m => [
            format(m.timestamp, "HH:mm:ss"),
            m.author.name,
            m.content
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['Heure', 'Auteur', 'Message']],
            body: tableData,
            theme: 'striped',
            headStyles: {fillColor: [140, 192, 136]},
            columnStyles: {
                0: {cellWidth: 25},
                1: {cellWidth: 35},
                2: {cellWidth: 'auto'}
            },
            didDrawPage: (data) => {
                // Filigrane (Watermark) on every page
                doc.setFontSize(40);
                doc.setTextColor(200, 200, 200);
                doc.saveGraphicsState();
                doc.setGState(new (doc as any).GState({opacity: 0.1}));
                doc.text(`Généré par ${userName}`, 105, 150, {
                    align: 'center',
                    angle: 45
                });
                doc.restoreGraphicsState();
            }
        });

        doc.save(`transcript_ticket_${ticket.id}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex flex-col h-svh p-3 gap-4 w-full">
                <div className="flex flex-col flex-grow overflow-y-auto mt-10">
                    <div className="flex flex-col gap-4 px-2 py-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-start gap-3">
                                <Skeleton className="h-9 w-9 rounded-lg shrink-0"/>
                                <div className="flex-1 space-y-2 py-1">
                                    <Skeleton className="h-4 w-1/4"/>
                                    <Skeleton className="h-4 w-3/4"/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-row items-center justify-center w-full">
            <div className="flex flex-col relative h-svh p-3 gap-4 w-full">
                <div className="flex flex-col flex-grow overflow-y-auto mt-10" ref={messagesContainerRef}>
                    <div className="flex flex-col gap-1">
                        {messages.map(({author, content, timestamp, reactions, id, replyID, edited}, key) => {
                            const prevMessage = key > 0 ? messages[key - 1] : null;
                            const nextMessage = key < messages.length - 1 ? messages[key + 1] : null;
                            const currentDate = new Date(timestamp).getTime();
                            const prevDate = prevMessage ? new Date(prevMessage.timestamp).getTime() : null;
                            const nextDate = nextMessage ? new Date(nextMessage.timestamp).getTime() : null;

                            const isSameAuthorAsPrev = prevMessage && prevMessage.author.id === author.id;
                            const isWithin10MinOfPrev = prevDate !== null && Math.abs(currentDate - prevDate) / 60000 < 10;
                            const showAuthorInfo = !isSameAuthorAsPrev || !isWithin10MinOfPrev;

                            const isSameAuthorAsNext = nextMessage && nextMessage.author.id === author.id;
                            const isWithin10MinOfNext = nextDate !== null && Math.abs(nextDate - currentDate) / 60000 < 10;
                            const isLastInBlock = !isSameAuthorAsNext || !isWithin10MinOfNext;

                            const ref = replyID ? messages.find(m => m.id === replyID) : undefined;
                            return (
                                <Message
                                    key={id}
                                    prevDate={prevDate as number}
                                    currentDate={currentDate}
                                    timestamp={timestamp}
                                    reactions={reactions}
                                    isLastInBlock={isLastInBlock}
                                    showAuthorInfo={showAuthorInfo}
                                    isAuthor={author.id === session?.user.id}
                                    profilePicture={author.image}
                                    authorRole={author.role}
                                    authorName={author.name}
                                    content={content}
                                    userID={session?.user.id as string}
                                    id={id}
                                    channelId={channelId}
                                    canManageMessages={false}
                                    readOnly={true}
                                    edited={edited}
                                    replyOf={ref ? {
                                        id: ref.id,
                                        authorName: ref.author.name,
                                        content: ref.content,
                                        image: ref.author.image
                                    } : undefined}
                                />
                            );
                        })}
                        {messages.length === 0 && (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Aucun message dans cette conversation.
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute top-6 right-6 flex flex-row gap-2">
                    {ticket && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-auto min-h-10 max-w-[300px] justify-between">
                                    <div className="flex flex-wrap gap-1 items-center">
                                        {ticket.categories && (ticket.categories as string[]).length > 0 ? (
                                            (ticket.categories as string[]).map((val: string) => (
                                                <Badge key={val} variant="secondary">
                                                    {val}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground">Aucune catégorie</span>
                                        )}
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="Modifier les catégories..."/>
                                    <CommandList>
                                        <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
                                        <CommandGroup>
                                            {availableCategories.map((item) => (
                                                <CommandItem
                                                    key={item}
                                                    value={item}
                                                    onSelect={() => {
                                                        const currentCats = (ticket.categories as string[]) || [];
                                                        const newCats = currentCats.includes(item)
                                                            ? currentCats.filter((v: string) => v !== item)
                                                            : [...currentCats, item];

                                                        apiFetch('/v1/tickets/update-categories', {
                                                            method: 'POST',
                                                            body: JSON.stringify({
                                                                ticketID: ticket.id,
                                                                categories: newCats
                                                            })
                                                        }).then(res => {
                                                            if (res.success) {
                                                                setTicket(res.update);
                                                                toast.success("Catégories mises à jour");
                                                            }
                                                        }).catch(() => toast.error("Erreur lors de la mise à jour"));
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            ((ticket.categories as string[]) || []).includes(item) ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {item}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    )}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <NotebookTabs className="mr-2 h-4 w-4"/>
                                Voir la transmission
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Fiche de transmission - Ticket #{ticket?.id}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="border-b pb-4">
                                    <p className="text-muted-foreground">
                                        Date de l'écoute
                                        : {ticket ? format(new Date(ticket.createdAt), "d MMMM yyyy", {locale: fr}) : ""}
                                    </p>
                                    {ticket && (
                                        <p className="text-muted-foreground">
                                            Durée de l'échange
                                            : {(() => {
                                            let durationSeconds = 0;
                                            if (messages.length >= 2) {
                                                const first = new Date(messages[0].timestamp || messages[0].createdAt);
                                                const last = new Date(messages[messages.length - 1].timestamp || messages[messages.length - 1].createdAt);
                                                durationSeconds = Math.floor((last.getTime() - first.getTime()) / 1000);
                                            } else {
                                                durationSeconds = Math.floor((new Date(ticket.updatedAt).getTime() - new Date(ticket.createdAt).getTime()) / 1000);
                                            }
                                            return formatDuration(durationSeconds);
                                        })()}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                                            <div className="w-1 h-6 bg-primary rounded-full"/>
                                            Problématique
                                        </h3>
                                        <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                                            {ticket?.problematic || "Non renseigné"}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                                            <div className="w-1 h-6 bg-primary rounded-full"/>
                                            Observations générales
                                        </h3>
                                        <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                                            {ticket?.observations || "Non renseigné"}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                                            <div className="w-1 h-6 bg-primary rounded-full"/>
                                            Informations supplémentaires
                                        </h3>
                                        <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                                            {ticket?.info || "Aucune information supplémentaire fournie."}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" onClick={downloadPDF}>
                        <FileText className="mr-2 h-4 w-4"/> Télécharger PDF
                    </Button>
                </div>
            </div>
        </div>
    );
}
