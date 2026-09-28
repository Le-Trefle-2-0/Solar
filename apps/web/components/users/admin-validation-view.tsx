"use client";

import React, {useEffect, useState} from 'react';
import {
    AlertCircle,
    CheckCircle2,
    FileText,
    IdCardLanyard,
    Loader2,
    X,
    XCircle,
    ChevronLeft,
    ChevronRight,
    User,
    Calendar,
    MapPin,
    ShieldCheck,
    History
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Label} from "@/components/ui/label";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Separator} from "@/components/ui/separator";
import {DisplayAccount} from "@/lib/interface";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import {cn} from "@/lib/utils";
import {SecureDocumentPreview} from "@/components/users/secure-document-preview";
import {validateDocumentsAction, rejectDocumentAction} from "@/app/actions/users";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Textarea} from "@/components/ui/textarea";

interface AdminValidationViewProps {
    account: DisplayAccount;
    onClose: () => void;
    onUpdate: (updatedAccount: DisplayAccount) => void;
}

export function AdminValidationView({account, onClose, onUpdate}: AdminValidationViewProps) {
    const router = useRouter();
    const [localAccount, setLocalAccount] = useState(account);
    const [activeDoc, setActiveDoc] = useState<'idCard' | 'casier'>(
        localAccount.idCardFileId ? 'idCard' : 'casier'
    );
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const documents = [
        {
            id: 'idCard',
            title: "Pièce d'identité",
            fileId: localAccount.idCardFileId,
            status: localAccount.idCardStatus,
            rejectReason: localAccount.idCardRejectReason,
            icon: IdCardLanyard,
            color: "text-blue-600",
        },
        {
            id: 'casier',
            title: "Casier judiciaire",
            fileId: localAccount.casierFileId,
            status: localAccount.casierStatus,
            rejectReason: localAccount.casierRejectReason,
            icon: FileText,
            color: "text-purple-600",
        }
    ].filter(doc => doc.fileId);

    const currentDoc = documents.find(d => d.id === activeDoc) || documents[0];

    const handleValidate = async () => {
        if (!currentDoc) return;
        setIsProcessing(true);
        try {
            await validateDocumentsAction(localAccount.id, currentDoc.id as 'idCard' | 'casier');
            toast.success(`${currentDoc.title} validé`);
            
            const updatedAccount = {...localAccount};
            if (currentDoc.id === 'idCard') {
                updatedAccount.idCardStatus = 'validated';
                updatedAccount.idCardRejectReason = null;
            } else {
                updatedAccount.casierStatus = 'validated';
                updatedAccount.casierRejectReason = null;
            }
            
            // Check if all are validated
            const isIdValidated = updatedAccount.idCardStatus === 'validated' || !updatedAccount.idCardFileId;
            const isCasierValidated = updatedAccount.casierStatus === 'validated' || !updatedAccount.casierFileId;
            if (isIdValidated && isCasierValidated) {
                updatedAccount.documentsStatus = 'validated';
                updatedAccount.documentsValidatedAt = new Date();
            }
            
            setLocalAccount(updatedAccount);
            onUpdate(updatedAccount);
            router.refresh();
        } catch (error) {
            toast.error("Erreur lors de la validation");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!currentDoc || !rejectReason.trim()) return;
        setIsProcessing(true);
        try {
            await rejectDocumentAction(localAccount.id, currentDoc.id as 'idCard' | 'casier', rejectReason);
            toast.success(`${currentDoc.title} refusé`);
            
            const updatedAccount = {...localAccount};
            if (currentDoc.id === 'idCard') {
                updatedAccount.idCardStatus = 'rejected';
                updatedAccount.idCardRejectReason = rejectReason;
            } else {
                updatedAccount.casierStatus = 'rejected';
                updatedAccount.casierRejectReason = rejectReason;
            }
            updatedAccount.documentsStatus = 'rejected';
            
            setLocalAccount(updatedAccount);
            onUpdate(updatedAccount);
            setRejectDialogOpen(false);
            setRejectReason("");
            router.refresh();
        } catch (error) {
            toast.error("Erreur lors du refus");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex bg-background animate-in fade-in duration-200">
            {/* Sidebar - User Info */}
            <div className="w-80 border-r flex flex-col bg-muted/10">
                <div className="p-4 border-b flex items-center justify-between bg-background">
                    <h2 className="font-semibold flex items-center gap-2">
                        <ShieldCheck className="text-primary" size={18}/>
                        Validation Admin
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X size={18}/>
                    </Button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                        {/* User Profile Summary */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                    {localAccount.firstName?.[0]}{localAccount.lastName?.[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold leading-tight">{localAccount.firstName} {localAccount.lastName}</h3>
                                    <p className="text-xs text-muted-foreground">{localAccount.email}</p>
                                </div>
                            </div>

                            <div className="grid gap-3 pt-2">
                                <div className="flex items-start gap-3 text-sm">
                                    <Calendar className="text-muted-foreground mt-0.5" size={16}/>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Né(e) le</p>
                                        <p className="font-medium">
                                            {localAccount.birthDate ? format(new Date(localAccount.birthDate), "dd MMMM yyyy", {locale: fr}) : 'Non renseigné'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 text-sm">
                                    <MapPin className="text-muted-foreground mt-0.5" size={16}/>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Adresse</p>
                                        <p className="font-medium leading-relaxed">
                                            {localAccount.addressNumber} {localAccount.addressStreet}<br/>
                                            {localAccount.addressPostalCode} {localAccount.addressCity}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator/>

                        {/* Documents List */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Documents à valider</h4>
                            <div className="space-y-1">
                                {documents.map((doc) => (
                                    <button
                                        key={doc.id}
                                        onClick={() => setActiveDoc(doc.id as 'idCard' | 'casier')}
                                        className={cn(
                                            "w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors",
                                            activeDoc === doc.id 
                                                ? "bg-primary/10 text-primary ring-1 ring-primary/20" 
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <doc.icon size={18} className={cn(activeDoc === doc.id ? "text-primary" : doc.color)}/>
                                            <span className="text-sm font-medium">{doc.title}</span>
                                        </div>
                                        {doc.status === 'validated' && <CheckCircle2 size={16} className="text-green-500"/>}
                                        {doc.status === 'rejected' && <XCircle size={16} className="text-red-500"/>}
                                        {doc.status === 'submitted' && <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"/>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Global Status */}
                        <div className="p-3 rounded-lg bg-background border space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Statut global</span>
                                <Badge variant="outline" className={cn(
                                    "text-[10px] h-5",
                                    localAccount.documentsStatus === 'validated' ? "bg-green-50 text-green-700 border-green-200" :
                                    localAccount.documentsStatus === 'submitted' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                    "bg-red-50 text-red-700 border-red-200"
                                )}>
                                    {localAccount.documentsStatus === 'validated' ? 'Validé' : 
                                     localAccount.documentsStatus === 'submitted' ? 'En attente' : 'Incomplet/Refusé'}
                                </Badge>
                            </div>
                            {localAccount.documentsSentAt && (
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1"><History size={10}/> Soumis le</span>
                                    <span>{format(new Date(localAccount.documentsSentAt), "dd/MM/yyyy HH:mm")}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-background space-y-2">
                    <Button 
                        className="w-full h-10 gap-2 bg-green-600 hover:bg-green-700" 
                        disabled={!currentDoc || currentDoc.status === 'validated' || isProcessing}
                        onClick={handleValidate}
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>}
                        Valider ce document
                    </Button>
                    <Button 
                        variant="outline" 
                        className="w-full h-10 gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        disabled={!currentDoc || isProcessing}
                        onClick={() => {
                            setRejectReason(currentDoc?.rejectReason || "");
                            setRejectDialogOpen(true);
                        }}
                    >
                        <XCircle size={18}/>
                        Refuser le document
                    </Button>
                </div>
            </div>

            {/* Main Content - Document Preview */}
            <div className="flex-1 flex flex-col bg-black/5 relative">
                {currentDoc ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                         <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                            <div className="bg-background/80 backdrop-blur px-4 py-1.5 rounded-full border shadow-sm flex items-center gap-3">
                                <span className="text-xs font-semibold">{currentDoc.title}</span>
                                <div className="h-3 w-[1px] bg-border"/>
                                <span className="text-[10px] text-muted-foreground">
                                    {documents.indexOf(currentDoc) + 1} / {documents.length}
                                </span>
                            </div>
                        </div>

                        {/* We use a modified version of SecureDocumentPreview that allows scrolling */}
                        <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center">
                            <div className="w-full max-w-5xl h-fit min-h-full">
                                <DocumentFrame 
                                    fileId={currentDoc.fileId!} 
                                    filename={`${currentDoc.title} - ${localAccount.firstName} ${localAccount.lastName}`} 
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                        <FileText size={64} className="opacity-20"/>
                        <p>Sélectionnez un document à prévisualiser</p>
                    </div>
                )}
            </div>

            {/* Reject Reason Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Refuser le document</DialogTitle>
                        <DialogDescription>
                            Veuillez indiquer la raison du refus pour {currentDoc?.title}. 
                            L'utilisateur pourra corriger et soumettre à nouveau.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="reason" className="mb-2 block">Raison du refus</Label>
                        <Textarea 
                            id="reason"
                            placeholder="Ex: Document illisible, photo floue, document expiré..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isProcessing}>
                            Annuler
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleReject} 
                            disabled={!rejectReason.trim() || isProcessing}
                        >
                            {isProcessing ? <Loader2 className="animate-spin mr-2" size={18}/> : null}
                            Confirmer le refus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Inner component for document rendering to handle its own loading/security logic
function DocumentFrame({fileId, filename}: {fileId: string, filename: string}) {
    const [isLoading, setIsLoading] = useState(true);
    const [mimeType, setMimeType] = useState<string | null>(null);
    const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:7001';
    const fileUrl = `${storageUrl}/v1/files/${fileId}`;

    useEffect(() => {
        setIsLoading(true);
        const fetchMetadata = async () => {
            try {
                const res = await fetch(`${storageUrl}/v1/files/${fileId}/meta`);
                if (!res.ok) throw new Error("Metadata error");
                const data = await res.json();
                setMimeType(data.mime);
            } catch (err) {
                const ext = filename.split('.').pop()?.toLowerCase();
                if (ext === 'pdf') setMimeType('application/pdf');
                else setMimeType('image/jpeg');
            }
        };
        fetchMetadata();
    }, [fileId, filename, storageUrl]);

    const isPdf = mimeType === 'application/pdf';
    const isImage = mimeType?.startsWith('image/');

    return (
        <div className="relative w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden min-h-[800px]"
             onContextMenu={(e) => e.preventDefault()}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                    <Loader2 className="animate-spin text-primary" size={40}/>
                </div>
            )}

            {isPdf ? (
                <iframe
                    src={`${fileUrl}#toolbar=0&navpanes=0`}
                    className="w-full h-full border-none select-none min-h-[800px]"
                    onLoad={() => setIsLoading(false)}
                    title="PDF Preview"
                />
            ) : isImage ? (
                <div className="w-full flex items-center justify-center bg-black/5 min-h-[800px]">
                    <img
                        src={fileUrl}
                        alt={filename}
                        className="max-w-full h-auto select-none pointer-events-none"
                        onLoad={() => setIsLoading(false)}
                        draggable={false}
                    />
                </div>
            ) : !isLoading && (
                <div className="flex flex-col items-center justify-center h-full min-h-[800px] gap-4">
                    <AlertCircle size={64} className="text-destructive"/>
                    <p className="text-muted-foreground">Type de fichier non supporté pour l'aperçu ({mimeType})</p>
                </div>
            )}

            {/* Security overlay - we keep onContextMenu to block right click but remove the pointer-events blocking div that prevents scrolling */}
            {!isLoading && (
                <div className="absolute inset-0 z-20 pointer-events-none" onContextMenu={(e) => e.preventDefault()} />
            )}

            <style jsx global>{`
                @media print {
                    body { display: none !important; }
                }
            `}</style>
        </div>
    );
}
