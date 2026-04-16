"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Page,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {authClient, useSession} from "@/lib/auth-client";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot,} from "@/components/ui/input-otp";
import {Button} from "@/components/ui/button";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {
    ArrowLeft,
    ArrowRight,
    Copy,
    Download,
    Fingerprint,
    Key,
    Loader2,
    LogOut,
    Monitor,
    Smartphone,
    Trash2
} from "lucide-react";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

export default function SettingsPage() {
    const router = useRouter();
    const {data: session, isPending} = useSession();
    const [loading, setLoading] = useState(false);

    // 2FA States
    const [isTwoFactorDialogOpen, setIsTwoFactorDialogOpen] = useState(false);
    const [twoFactorStep, setTwoFactorStep] = useState<"password" | "qr" | "verify" | "recovery">("password");
    const [qrCode, setQrCode] = useState("");
    const [twoFactorOTP, setTwoFactorOTP] = useState("");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);

    // Passkey States
    const [passkeys, setPasskeys] = useState<any[]>([]);
    const [passkeyName, setPasskeyName] = useState("");

    // Password Confirmation States
    const [isConfirmPasswordOpen, setIsConfirmPasswordOpen] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pendingAction, setPendingAction] = useState<(() => Promise<void> | void) | null>(null);
    const [isDestructiveAction, setIsDestructiveAction] = useState(false);

    // Sessions & OAuth States
    const [sessions, setSessions] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);

    useEffect(() => {
        if (session?.user) {
            setIsTwoFactorEnabled(!!session.user.twoFactorEnabled);
            fetchPasskeys();
            fetchSessions();
            fetchAccounts();
        }
    }, [session]);

    const fetchSessions = async () => {
        const {data, error} = await authClient.listSessions();
        if (data && !error) {
            setSessions(data);
        }
    };

    const fetchAccounts = async () => {
        const {data, error} = await authClient.listAccounts();
        if (data && !error) {
            setAccounts(data);
        }
    };

    const fetchPasskeys = async () => {
        const {data, error} = await authClient.passkey.listUserPasskeys();
        if (data && !error) {
            setPasskeys(data);
        }
    };

    if (isPending) return null;
    if (!session) return null;

    const user = session.user;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("L'image est trop volumineuse (max 2Mo)");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setLoading(true);
            const {error} = await authClient.updateUser({
                image: base64String,
            });
            setLoading(false);

            if (error) {
                toast.error(error.message || "Erreur lors de la mise à jour de l'image");
            } else {
                toast.success("Photo de profil mise à jour");
                router.refresh();
            }
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const username = formData.get("username") as string;

        setLoading(true);

        const {error} = await authClient.updateUser({
            name,
            username,
        });
        setLoading(false);

        if (error) {
            toast.error(error.message || "Erreur lors de la mise à jour");
        } else {
            toast.success("Profil mis à jour avec succès");
            router.refresh();
        }
    };

    const handleUpdateEmail = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;

        setLoading(true);
        const {error} = await authClient.changeEmail({
            newEmail: email,
        });
        setLoading(false);

        if (error) {
            toast.error(error.message || "Erreur lors du changement d'e-mail");
        } else {
            toast.success("Un e-mail de confirmation a été envoyé à votre nouvelle adresse");
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const currentPassword = formData.get("currentPassword") as string;
        const newPassword = formData.get("newPassword") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (newPassword !== confirmPassword) {
            return toast.error("Les mots de passe ne correspondent pas");
        }

        setLoading(true);
        const {error} = await authClient.changePassword({
            currentPassword,
            newPassword,
            revokeOtherSessions: true,
        });
        setLoading(false);

        if (error) {
            toast.error(error.message || "Erreur lors du changement de mot de passe");
        } else {
            toast.success("Mot de passe mis à jour avec succès");
            (e.target as HTMLFormElement).reset();
        }
    };

    const resetTwoFactorStates = () => {
        setTwoFactorStep("password");
        setQrCode("");
        setTwoFactorOTP("");
        setBackupCodes([]);
        setConfirmPassword("");
        setPendingAction(null);
    };

    const handleEnableTwoFactor = async () => {
        if (!confirmPassword) {
            setTwoFactorStep("password");
            return;
        }

        setLoading(true);
        const {data, error} = await authClient.twoFactor.enable({
            issuer: "Solar",
            password: confirmPassword,
        });

        if (error) {
            setLoading(false);
            toast.error(error.message || "Erreur lors de l'activation de l'A2F");
            if (error.status === 401 || error.message?.includes("password")) {
                setConfirmPassword("");
                setTwoFactorStep("password");
            }
        } else if (data) {
            setQrCode(data.totpURI);
            setTwoFactorStep("qr");
            setLoading(false);
        }
    };

    const handleVerifyTwoFactor = async () => {
        setLoading(true);
        const {data, error} = await authClient.twoFactor.verifyTotp({
            code: twoFactorOTP,
        });

        if (error) {
            setLoading(false);
            toast.error(error.message || "Code invalide");
        } else if (data) {
            // Generate backup codes after enabling
            console.log("[A2F] TOTP Verified, generating backup codes...");
            const {data: codesData, error: codesError} = await authClient.twoFactor.generateBackupCodes({
                password: confirmPassword,
            });

            console.log("[A2F] generateBackupCodes result:", {codesData, codesError});

            if (codesError) {
                console.error("[A2F] Error generating backup codes:", codesError);
                toast.error("Erreur lors de la génération des codes de secours : " + codesError.message);
            }

            if (codesData) {
                // Better Auth typical response for generateBackupCodes is either the array or { backupCodes: string[] }
                const codes = Array.isArray(codesData) ? codesData : (codesData as any).backupCodes;
                if (Array.isArray(codes)) {
                    console.log("[A2F] Backup codes set:", codes.length);
                    setBackupCodes(codes);
                } else {
                    console.warn("[A2F] Unexpected backup codes format:", codesData);
                }
            }

            setLoading(false);
            toast.success("A2F activée avec succès");
            setIsTwoFactorEnabled(true);
            setTwoFactorStep("recovery");
        }
    };

    const handleDisableTwoFactor = async () => {
        if (!confirmPassword) {
            return withPassword(handleDisableTwoFactor, true);
        }

        setLoading(true);
        const {error} = await authClient.twoFactor.disable({
            password: confirmPassword,
        });
        setLoading(false);

        setConfirmPassword("");

        if (error) {
            toast.error(error.message || "Erreur lors de la désactivation");
        } else {
            toast.success("A2F désactivée");
            setIsTwoFactorEnabled(false);
        }
    };

    const withPassword = (action: () => Promise<void> | void, isDestructive = false) => {
        setPendingAction(() => action);
        setIsDestructiveAction(isDestructive);
        setIsConfirmPasswordOpen(true);
    };

    const handleConfirmPassword = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!confirmPassword) return;

        // On n'appelle pas encore setIsConfirmPasswordOpen(false) 
        // pour garder l'état du mot de passe stable pendant l'action
        if (pendingAction) {
            await pendingAction();
            // Si l'action a réussi (pas d'erreur levée et pas besoin d'autres étapes), on ferme
            setIsConfirmPasswordOpen(false);

            // On ne nettoie pendingAction que si on n'est pas dans le flux A2F
            if (!isTwoFactorDialogOpen) {
                setPendingAction(null);
                setConfirmPassword(""); // On nettoie ici
            }
        } else {
            setIsConfirmPasswordOpen(false);
            setConfirmPassword(""); // On nettoie ici aussi
        }
    };

    const handleAddPasskey = async (): Promise<void> => {
        setLoading(true);
        const {error} = await authClient.passkey.addPasskey({
            name: passkeyName || "Ma clé de sécurité",
        });
        setLoading(false);

        if (error) {
            if (error.status === 401 || error.message?.includes("fresh")) {
                withPassword(handleAddPasskey);
                return;
            }
            toast.error(error.message || "Erreur lors de l'ajout de la clé");
        } else {
            toast.success("Clé de sécurité ajoutée");
            setPasskeyName("");
            fetchPasskeys();
            setConfirmPassword("");
        }
    };

    const handleDeletePasskey = async (id: string): Promise<void> => {
        setLoading(true);
        const {error} = await authClient.passkey.deletePasskey({
            id,
        });
        setLoading(false);

        if (error) {
            if (error.status === 401 || error.message?.includes("fresh")) {
                withPassword(() => handleDeletePasskey(id));
                return;
            }
            toast.error(error.message || "Erreur lors de la suppression de la clé");
        } else {
            toast.success("Clé de sécurité supprimée");
            fetchPasskeys();
            setConfirmPassword("");
        }
    };

    const handleRevokeSession = async (token: string) => {
        setLoading(true);
        const {error} = await authClient.revokeSession({
            token,
        });
        setLoading(false);

        if (error) {
            toast.error(error.message || "Erreur lors de la déconnexion");
        } else {
            toast.success("Session révoquée");
            fetchSessions();
        }
    };

    const handleLinkDiscord = async () => {
        setLoading(true);
        const {error} = await authClient.linkSocial({
            provider: "discord",
            callbackURL: window.location.href,
        });
        setLoading(false);

        if (error) {
            toast.error(error.message || "Erreur lors de l'association Discord");
        }
    };

    const handleUnlinkDiscord = async () => {
        setLoading(true);
        const {error} = await authClient.unlinkAccount({
            providerId: "discord",
        });
        setLoading(false);

        if (error) {
            toast.error(error.message || "Erreur lors de la dissociation");
        } else {
            toast.success("Compte Discord dissocié");
            fetchAccounts();
        }
    };

    return (
        <Page title="Paramètres" description="Gérez vos informations personnelles et les réglages de votre compte.">
            <div className="max-w-4xl space-y-6">
                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile">Profil</TabsTrigger>
                        <TabsTrigger value="account">Compte</TabsTrigger>
                        <TabsTrigger value="security">Sécurité</TabsTrigger>
                    </TabsList>

                    {/* Profil Tab */}
                    <TabsContent value="profile" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informations publiques</CardTitle>
                                <CardDescription>Ces informations seront visibles par les autres
                                    membres.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div className="flex items-center gap-6 pb-4">
                                        <Avatar className="h-24 w-24 border-2 border-main">
                                            <AvatarImage src={user.image || ""} alt={user.name}/>
                                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                                {user.name?.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-4 flex-1 max-w-sm">
                                            <div className="space-y-2">
                                                <Label htmlFor="imageFile">Photo de profil (Upload)</Label>
                                                <Input
                                                    id="imageFile"
                                                    name="imageFile"
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/jpg"
                                                    className="cursor-pointer"
                                                    onChange={handleImageUpload}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nom complet</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                defaultValue={user.name || ""}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="username">Pseudo (Username)</Label>
                                            <Input
                                                id="username"
                                                name="username"
                                                defaultValue={(user as any).username || ""}
                                                placeholder="mon_pseudo"
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Enregistrer le profil
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="account" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Adresse e-mail</CardTitle>
                                <CardDescription>Changez votre adresse e-mail de connexion.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-md">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email actuel : {user.email}</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="Nouvel e-mail"
                                                required
                                            />
                                            <Button type="submit" variant="outline" disabled={loading}>
                                                Modifier
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Mot de passe</CardTitle>
                                <CardDescription>Sécurisez votre compte avec un mot de passe robuste.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                                        <Input id="currentPassword" name="currentPassword" type="password" required/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                                        <Input id="newPassword" name="newPassword" type="password" required/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                                        <Input id="confirmPassword" name="confirmPassword" type="password" required/>
                                    </div>
                                    <Button type="submit" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Changer le mot de passe
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Comptes connectés</CardTitle>
                                <CardDescription>Gérez les services tiers connectés à votre compte.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-10 w-10 flex items-center justify-center rounded-full bg-[#5865F2]/10 text-[#5865F2]">
                                            <svg className="h-6 w-6" aria-hidden="true" focusable="false"
                                                 data-prefix="fab"
                                                 data-icon="discord" role="img" xmlns="http://www.w3.org/2000/svg"
                                                 viewBox="0 0 127.14 96.36">
                                                <path fill="currentColor"
                                                      d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.48,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.24-16.14h0C130.46,50.45,121.43,26.71,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5.08-12.74,11.41-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.08-12.74,11.44-12.74S96.23,46,96.12,53,91.07,65.69,84.69,65.69Z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium">Discord</p>
                                            <p className="text-sm text-muted-foreground">
                                                {accounts.some(a => a.providerId === "discord") ? "Connecté" : "Non connecté"}
                                            </p>
                                        </div>
                                    </div>
                                    {accounts.some(a => a.providerId === "discord") ? (
                                        <Button variant="outline" size="sm" onClick={handleUnlinkDiscord}
                                                disabled={loading}>
                                            Dissocier
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={handleLinkDiscord}
                                                disabled={loading}>
                                            Associer
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Double authentification (A2F)</CardTitle>
                                <CardDescription>Ajoutez une couche de sécurité supplémentaire via une application
                                    d'authentification.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="h-5 w-5 text-muted-foreground"/>
                                        <div>
                                            <p className="font-medium">Application d'authentification</p>
                                            <p className="text-sm text-muted-foreground">
                                                {isTwoFactorEnabled ? "Activée" : "Non configurée"}
                                            </p>
                                        </div>
                                    </div>
                                    {isTwoFactorEnabled ? (
                                        <Button variant="destructive" size="sm" onClick={handleDisableTwoFactor}
                                                disabled={loading}>
                                            Désactiver
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm"
                                                onClick={() => {
                                                    setTwoFactorStep("password");
                                                    setIsTwoFactorDialogOpen(true);
                                                }}>
                                            Activer
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Clés de sécurité</CardTitle>
                                <CardDescription>Connectez-vous avec vos clés physiques, FaceID ou
                                    TouchID.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {passkeys.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        {passkeys.map((pk) => (
                                            <div key={pk.id}
                                                 className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                                <div className="flex items-center gap-3">
                                                    <Fingerprint className="h-4 w-4 text-primary"/>
                                                    <span className="text-sm font-medium">{pk.name}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => handleDeletePasskey(pk.id)}
                                                >
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Nom de la clé"
                                        value={passkeyName}
                                        onChange={(e) => setPasskeyName(e.target.value)}
                                        className="max-w-xs"
                                    />
                                    <Button onClick={handleAddPasskey} disabled={loading} variant="outline"
                                            className="gap-2">
                                        <Key className="h-4 w-4"/>
                                        Ajouter une clé
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Sessions actives</CardTitle>
                                <CardDescription>Gérez les appareils connectés à votre compte.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {sessions.length > 0 ? (
                                    <div className="space-y-3">
                                        {sessions.map((s) => (
                                            <div key={s.id}
                                                 className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                                                <div className="flex items-center gap-3">
                                                    {s.userAgent?.toLowerCase().includes("mobile") ? (
                                                        <Smartphone className="h-5 w-5 text-muted-foreground"/>
                                                    ) : (
                                                        <Monitor className="h-5 w-5 text-muted-foreground"/>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {s.userAgent || "Appareil inconnu"}
                                                            {s.id === session.session.id && (
                                                                <span
                                                                    className="ml-2 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold">Actuelle</span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            IP: {s.ipAddress || "Inconnue"} • Dernière
                                                            activité: {new Date(s.updatedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                {s.id !== session.session.id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        onClick={() => handleRevokeSession(s.token)}
                                                        disabled={loading}
                                                    >
                                                        <LogOut className="h-4 w-4"/>
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">Aucune autre session
                                        active.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-destructive/20">
                            <CardHeader>
                                <CardTitle className="text-destructive">Zone de danger</CardTitle>
                                <CardDescription>Actions irréversibles concernant votre compte.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="destructive" className="gap-2"
                                        onClick={() => withPassword(async () => {
                                            toast.error("La suppression de compte n'est pas encore implémentée.");
                                        }, true)}>
                                    <Trash2 className="h-4 w-4"/>
                                    Supprimer mon compte
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* A2F Dialog */}
            <Dialog open={isTwoFactorDialogOpen} onOpenChange={(open) => {
                setIsTwoFactorDialogOpen(open);
                if (!open) resetTwoFactorStates();
            }}>
                <DialogContent className="max-w-[400px] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>Double authentification (A2F)</DialogTitle>
                        <DialogDescription>
                            {twoFactorStep === "password" && "Veuillez confirmer votre mot de passe pour continuer."}
                            {twoFactorStep === "qr" && "Scannez ce QR Code avec votre application d'authentification."}
                            {twoFactorStep === "verify" && "Entrez le code à 6 chiffres généré par votre application."}
                            {twoFactorStep === "recovery" && "Conservez ces codes de secours en lieu sûr. Ils vous permettront d'accéder à votre compte si vous perdez votre appareil."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {twoFactorStep === "password" && (
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleEnableTwoFactor();
                            }} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="two-factor-password">Votre mot de passe actuel</Label>
                                    <Input
                                        id="two-factor-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="ghost"
                                            onClick={() => setIsTwoFactorDialogOpen(false)}>
                                        Annuler
                                    </Button>
                                    <Button type="submit" className="flex-1" disabled={loading || !confirmPassword}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Suivant
                                        <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Button>
                                </div>
                            </form>
                        )}

                        {twoFactorStep === "qr" && (
                            <div className="space-y-6 flex flex-col items-center">
                                <div className="bg-white p-4 rounded-xl border-2 border-primary/20 shadow-inner">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCode)}&size=160x160`}
                                        alt="QR Code A2F"
                                        className="h-40 w-40"
                                    />
                                </div>
                                <div className="text-center space-y-2 w-full">
                                    <p className="text-xs font-mono break-all text-muted-foreground select-all bg-muted p-2 rounded">
                                        {qrCode}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Si vous ne pouvez pas scanner le code, copiez cette clé dans votre application.
                                    </p>
                                </div>
                                <Button className="w-full" onClick={() => setTwoFactorStep("verify")}>
                                    J'ai scanné le code
                                    <ArrowRight className="ml-2 h-4 w-4"/>
                                </Button>
                            </div>
                        )}

                        {twoFactorStep === "verify" && (
                            <div className="space-y-6 flex flex-col items-center">
                                <InputOTP
                                    id="otp"
                                    maxLength={6}
                                    value={twoFactorOTP}
                                    onChange={(value) => setTwoFactorOTP(value)}
                                    autoFocus
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0}/>
                                        <InputOTPSlot index={1}/>
                                        <InputOTPSlot index={2}/>
                                    </InputOTPGroup>
                                    <InputOTPSeparator/>
                                    <InputOTPGroup>
                                        <InputOTPSlot index={3}/>
                                        <InputOTPSlot index={4}/>
                                        <InputOTPSlot index={5}/>
                                    </InputOTPGroup>
                                </InputOTP>
                                <div className="flex gap-2 w-full pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setTwoFactorStep("qr")}>
                                        <ArrowLeft className="mr-2 h-4 w-4"/>
                                        Retour
                                    </Button>
                                    <Button className="flex-1" onClick={handleVerifyTwoFactor}
                                            disabled={loading || twoFactorOTP.length < 6}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Vérifier et activer
                                    </Button>
                                </div>
                            </div>
                        )}

                        {twoFactorStep === "recovery" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {backupCodes.length > 0 ? (
                                        backupCodes.map((code, index) => (
                                            <div key={index}
                                                 className="bg-muted p-2 rounded text-center font-mono text-sm border border-border/50">
                                                {code}
                                            </div>
                                        ))
                                    ) : (
                                        <div
                                            className="col-span-2 py-8 text-center text-muted-foreground animate-pulse">
                                            Chargement des codes...
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 pt-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                            disabled={backupCodes.length === 0}
                                            onClick={() => {
                                                navigator.clipboard.writeText(backupCodes.join("\n"));
                                                toast.success("Codes copiés dans le presse-papier");
                                            }}
                                        >
                                            <Copy className="h-4 w-4"/>
                                            Copier
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                            disabled={backupCodes.length === 0}
                                            onClick={() => {
                                                const element = document.createElement("a");
                                                const file = new Blob([backupCodes.join("\n")], {type: 'text/plain'});
                                                element.href = URL.createObjectURL(file);
                                                element.download = "solar-recovery-codes.txt";
                                                document.body.appendChild(element);
                                                element.click();
                                                document.body.removeChild(element);
                                                toast.success("Codes téléchargés");
                                            }}
                                        >
                                            <Download className="h-4 w-4"/>
                                            Télécharger
                                        </Button>
                                    </div>
                                    <Button className="w-full" onClick={() => {
                                        setIsTwoFactorDialogOpen(false);
                                        resetTwoFactorStates();
                                    }}>
                                        Terminer
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Password Confirmation Dialog */}
            <Dialog open={isConfirmPasswordOpen} onOpenChange={setIsConfirmPasswordOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmez votre mot de passe</DialogTitle>
                        <DialogDescription>
                            Pour des raisons de sécurité, veuillez confirmer votre mot de passe avant de procéder à
                            cette action sensible.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleConfirmPassword} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Mot de passe</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsConfirmPasswordOpen(false)}>
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={!confirmPassword || loading}
                                variant={isDestructiveAction ? "destructive" : "default"}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Confirmer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Page>
    );
}
