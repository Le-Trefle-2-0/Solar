"use client";

import React, {useEffect, useRef, useState} from 'react';
import {FileText, Loader2, AlertCircle, X} from "lucide-react";
import {Button} from "@/components/ui/button";

interface SecureDocumentPreviewProps {
    fileId: string;
    filename: string;
    onClose: () => void;
}

export function SecureDocumentPreview({fileId, filename, onClose}: SecureDocumentPreviewProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [mimeType, setMimeType] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    // Same-origin proxy with access control; storage is not reachable from the browser
    const storageUrl = '/api/files';
    const fileUrl = `${storageUrl}/${encodeURIComponent(fileId)}`;

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const res = await fetch(`${storageUrl}/${encodeURIComponent(fileId)}/meta`);
                if (!res.ok) throw new Error("Impossible de charger les métadonnées");
                const data = await res.json();
                setMimeType(data.mime);
            } catch (err) {
                console.error("Error fetching file metadata:", err);
                // Fallback to extension if metadata fetch fails
                const ext = filename.split('.').pop()?.toLowerCase();
                if (ext === 'pdf') setMimeType('application/pdf');
                else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
                    setMimeType(`image/${ext === 'jpg' ? 'jpeg' : ext}`);
                } else {
                    // Nothing to show: the error message replaces the spinner
                    setIsLoading(false);
                }
            }
        };

        fetchMetadata();
    }, [fileId, storageUrl, filename]);

    const isPdf = mimeType === 'application/pdf';
    const isImage = mimeType?.startsWith('image/');

    // A type with no preview: its message is shown at once, without a spinner over it
    useEffect(() => {
        if (mimeType && !isPdf && !isImage) setIsLoading(false);
    }, [mimeType, isPdf, isImage]);

    // A modal: focus on its close button, Escape closes it
    const closeRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        closeRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="document-preview-title"
             className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded">
                        <FileText size={20} className="text-primary" aria-hidden/>
                    </div>
                    <div>
                        <h2 id="document-preview-title" className="font-semibold text-sm leading-none">{filename}</h2>
                        <p className="text-xs text-muted-foreground mt-1">Aperçu sécurisé</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button ref={closeRef} variant="ghost" size="icon" onClick={onClose} aria-label="Fermer l'aperçu">
                        <X size={20} aria-hidden/>
                    </Button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden bg-muted/20 flex items-center justify-center p-4">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                        <Loader2 className="animate-spin text-primary" size={40} aria-hidden/>
                        <span className="sr-only" role="status">Chargement de l'aperçu…</span>
                    </div>
                )}

                {/* Main preview area with restricted interactions */}
                <div 
                    className="relative w-full h-full max-w-5xl bg-white rounded-lg shadow-2xl overflow-hidden"
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {mimeType ? (
                        isPdf ? (
                            <iframe
                                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                className="w-full h-full border-none select-none"
                                onLoad={() => setIsLoading(false)}
                                title={`Aperçu : ${filename}`}
                            />
                        ) : isImage ? (
                            <div className="w-full h-full flex items-center justify-center bg-black/5 overflow-auto">
                                <img
                                    src={fileUrl}
                                    alt={filename}
                                    className="max-w-full max-h-full object-contain select-none pointer-events-none"
                                    onLoad={() => setIsLoading(false)}
                                    onError={() => {
                                        setMimeType(null);
                                        setIsLoading(false);
                                    }}
                                    draggable={false}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <FileText size={64} className="text-muted-foreground"/>
                                <p className="text-muted-foreground">L'aperçu n'est pas disponible pour ce type de fichier ({mimeType}).</p>
                                <Button variant="outline" onClick={() => setIsLoading(false)}>OK</Button>
                            </div>
                        )
                    ) : !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <AlertCircle size={64} className="text-destructive"/>
                            <p className="text-muted-foreground">Erreur lors du chargement de l'aperçu.</p>
                        </div>
                    )}
                    
                    {/* Over images only: blocks dragging and the context menu. Never over a PDF, whose
                        pages must stay scrollable (a recto/verso document has two). */}
                    {!isLoading && isImage && (
                        <div 
                            className="absolute inset-0 z-20" 
                            style={{ pointerEvents: 'auto' }}
                            onContextMenu={(e) => e.preventDefault()}
                        />
                    )}
                </div>
            </div>

            <div className="p-4 border-t bg-muted/50">
                <div className="max-w-3xl mx-auto text-center">
                    <p className="text-xs text-muted-foreground italic">
                        Ce document est mis à disposition pour consultation administrative uniquement. 
                        Le téléchargement et la copie sont restreints pour des raisons de sécurité.
                    </p>
                </div>
            </div>
            
            <style jsx global>{`
                @media print {
                    body {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
