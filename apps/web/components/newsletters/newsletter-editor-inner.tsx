"use client"
import React, {useMemo, useState} from "react";
import {apiFetch} from "@/lib/api";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {ArrowLeft, Calendar, Globe, Loader2, Save, Send, Users} from "lucide-react";
import Link from "next/link";
import {toast} from "sonner";
import dynamic from "next/dynamic";
import {MantineProvider} from "@mantine/core";
import {fr} from "@blocknote/core/locales";
import {useCreateBlockNote} from "@blocknote/react";
import "@mantine/core/styles.css";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import {ScheduleDialog, SendConfirmationDialog} from "./newsletter-dialogs";

// Dynamically import BlockNote to avoid SSR issues
const BlockNoteEditor = dynamic(() => import("@blocknote/mantine").then(m => m.BlockNoteView), {ssr: false});

interface NewsletterEditorInnerProps {
    id: string;
    initialNewsletter: any;
    volunteerCount: number;
}

export default function NewsletterEditorInner({id, initialNewsletter, volunteerCount}: NewsletterEditorInnerProps) {
    const [newsletter, setNewsletter] = useState<any>(initialNewsletter);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [title, setTitle] = useState(initialNewsletter.title || "");
    const [sendDialogOpen, setSendDialogOpen] = useState(false);
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

    const initialContent = useMemo(() => {
        if (!initialNewsletter?.content) return undefined;
        try {
            let rawContent = initialNewsletter.content;
            console.log("Raw newsletter content type:", typeof rawContent);

            // If it's an array of numbers (bytes), convert to string
            if (Array.isArray(rawContent) && rawContent.length > 0 && typeof rawContent[0] === 'number') {
                console.log("Content is byte array, converting to string...");
                rawContent = new TextDecoder().decode(new Uint8Array(rawContent));
            } else if (typeof rawContent === 'object' && rawContent !== null && !Array.isArray(rawContent)) {
                // Handle case where it might be {type: 'Buffer', data: [...]}
                if (rawContent.type === 'Buffer' && Array.isArray(rawContent.data)) {
                    console.log("Content is Buffer object, converting to string...");
                    rawContent = new TextDecoder().decode(new Uint8Array(rawContent.data));
                }
            }

            // If it's a string, check if it's a comma-separated list of numbers (ASCII)
            if (typeof rawContent === 'string') {
                const trimmed = rawContent.trim();
                console.log("Content string (first 100 chars):", trimmed.substring(0, 100));

                // New check: Is it a comma-separated list of numbers?
                // Example: "91,123,34,..."
                if (/^(\d+,)+\d+$/.test(trimmed) || /^\d+$/.test(trimmed)) {
                    console.log("Content is a string of comma-separated numbers, converting...");
                    const numbers = trimmed.split(',').map(Number);
                    const uint8Array = new Uint8Array(numbers);
                    rawContent = new TextDecoder().decode(uint8Array);
                    console.log("Converted number-string to:", rawContent.substring(0, 100));
                }

                if (rawContent.startsWith('[') || rawContent.startsWith('{')) {
                    const parsed = JSON.parse(rawContent);
                    const blocks = Array.isArray(parsed) ? parsed : (parsed.blocks || undefined);
                    console.log("Parsed blocks:", blocks);
                    return blocks;
                }
            } else if (Array.isArray(rawContent)) {
                // If it's already an array of blocks
                return rawContent;
            }
        } catch (e) {
            console.error("Failed to parse initial content", e);
        }
        return undefined;
    }, [initialNewsletter]);

    const editor = useCreateBlockNote({
        dictionary: fr,
        initialContent,
        uploadFile: async (file: File) => {
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onload = async () => {
                    try {
                        const base64 = reader.result as string;
                        const res = await apiFetch('/v1/image', {
                            method: 'POST',
                            body: JSON.stringify({image: base64})
                        });
                        resolve(res.image.link);
                    } catch (e) {
                        reject(e);
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
    });

    // Fallback: if editor is empty but we have initial content, replace blocks
    // This handles cases where initialContent prop might have been missed during init
    React.useEffect(() => {
        if (editor && initialContent && initialContent.length > 0) {
            // Only replace if the editor is "empty" (only contains one empty default block)
            const isDefaultEmpty = editor.document.length === 1 &&
                editor.document[0].type === "paragraph" &&
                editor.document[0].content.length === 0;

            if (isDefaultEmpty) {
                console.log("Editor is empty, applying initial content fallback");
                editor.replaceBlocks(editor.document, initialContent);
            }
        }
    }, [editor, initialContent]);


    const saveNewsletter = async (statusOverride?: string, scheduledAtOverride?: string) => {
        if (!editor) return;
        setSaving(true);
        try {
            const content = JSON.stringify(editor.document);
            const htmlContent = editor.blocksToHTMLLossy(editor.document);
            const currentStatus = statusOverride || newsletter?.status || 'draft';

            await apiFetch(`/v1/newsletters/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title,
                    content,
                    htmlContent,
                    status: currentStatus,
                    scheduledAt: scheduledAtOverride
                })
            });
            toast.success("Newsletter enregistrée");
            setNewsletter((prev: any) => ({
                ...prev,
                title,
                status: currentStatus,
                scheduledAt: scheduledAtOverride || prev.scheduledAt
            }));
        } catch (error: any) {
            toast.error("Erreur lors de l'enregistrement: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSendNow = async () => {
        setSending(true);
        try {
            const content = JSON.stringify(editor.document);
            const htmlContent = editor.blocksToHTMLLossy(editor.document);

            // First save the latest content
            await apiFetch(`/v1/newsletters/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title,
                    content,
                    htmlContent
                })
            });

            // Then send
            await apiFetch(`/v1/newsletters/${id}/send`, {
                method: 'POST'
            });

            toast.success("Newsletter envoyée !");
            setNewsletter((prev: any) => ({...prev, status: 'sent'}));
            setSendDialogOpen(false);
        } catch (error: any) {
            toast.error("Erreur lors de l'envoi: " + error.message);
        } finally {
            setSending(false);
        }
    };

    const handleSchedule = async (date: Date) => {
        setSaving(true);
        try {
            const content = JSON.stringify(editor.document);
            const htmlContent = editor.blocksToHTMLLossy(editor.document);

            await apiFetch(`/v1/newsletters/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title,
                    content,
                    htmlContent,
                    status: 'scheduled',
                    scheduledAt: date.toISOString()
                })
            });
            toast.success("Newsletter programmée pour le " + date.toLocaleString());
            setNewsletter((prev: any) => ({...prev, status: 'scheduled', scheduledAt: date.toISOString()}));
            setScheduleDialogOpen(false);
        } catch (error: any) {
            toast.error("Erreur lors de la programmation: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUnschedule = async () => {
        setSaving(true);
        try {
            await apiFetch(`/v1/newsletters/${id}/unschedule`, {
                method: 'POST'
            });
            toast.success("Programmation annulée");
            setNewsletter((prev: any) => ({...prev, status: 'draft', scheduledAt: null}));
        } catch (error: any) {
            toast.error("Erreur lors de l'annulation: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const isReadOnly = newsletter?.status === 'sent' || newsletter?.status === 'scheduled';

    return (
        <div className="h-full flex flex-col overflow-hidden bg-muted/10">
            <header className="bg-background border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Link href="/app/newsletters">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5"/>
                        </Button>
                    </Link>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-xl font-bold bg-transparent border-none focus-visible:ring-0 w-[400px] p-0 h-auto"
                        placeholder="Titre de la newsletter"
                        disabled={isReadOnly}
                    />
                </div>
                <div className="flex items-center gap-2">
                    {newsletter?.status === 'scheduled' && (
                        <Button variant="destructive" onClick={handleUnschedule} disabled={saving || sending}
                                className="gap-2">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Calendar className="h-4 w-4"/>}
                            Annuler la programmation
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => saveNewsletter()}
                            disabled={saving || sending || isReadOnly}
                            className="gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                        Enregistrer
                    </Button>
                    <Button variant="outline" onClick={() => setScheduleDialogOpen(true)}
                            disabled={saving || sending || isReadOnly}
                            className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                        <Calendar className="h-4 w-4"/>
                        Programmer
                    </Button>
                    <Button onClick={() => setSendDialogOpen(true)}
                            disabled={saving || sending || newsletter?.status === 'sent' || newsletter?.status === 'scheduled'}
                            className="gap-2 bg-green-600 hover:bg-green-700">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                        Envoyer maintenant
                    </Button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {isReadOnly && (
                        <div
                            className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md flex items-center gap-3">
                            <Calendar className="h-5 w-5"/>
                            <div>
                                <p className="font-medium">
                                    {newsletter?.status === 'sent'
                                        ? "Cette newsletter a déjà été envoyée et ne peut plus être modifiée."
                                        : `Cette newsletter est programmée pour le ${new Date(newsletter.scheduledAt).toLocaleString()} and est en lecture seule.`}
                                </p>
                            </div>
                        </div>
                    )}
                    <Card className="min-h-[600px] shadow-sm border-none ring-1 ring-border">
                        <CardContent className="pt-8">
                            <MantineProvider>
                                <BlockNoteEditor
                                    editor={editor}
                                    theme="light"
                                    className="min-h-[500px]"
                                    editable={!isReadOnly}
                                />
                            </MantineProvider>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1"><Users
                                className="h-4 w-4"/> {volunteerCount} bénévoles ciblés</span>
                            <span className="flex items-center gap-1"><Globe className="h-4 w-4"/> Mode public désactivé</span>
                        </div>
                        <span>Dernière modification par {newsletter?.author?.name || "Utilisateur"}</span>
                    </div>
                </div>
            </main>

            <SendConfirmationDialog
                open={sendDialogOpen}
                onOpenChange={setSendDialogOpen}
                onConfirm={handleSendNow}
                sending={sending}
            />

            <ScheduleDialog
                open={scheduleDialogOpen}
                onOpenChange={setScheduleDialogOpen}
                onSchedule={handleSchedule}
                saving={saving}
            />
        </div>
    );
}
