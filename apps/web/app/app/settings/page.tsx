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
import {Button} from "@/components/ui/button";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {Fingerprint, Key, Loader2, QrCode, Smartphone, Trash2} from "lucide-react";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

export default function SettingsPage() {
    const router = useRouter();
    const {data: session, isPending} = useSession();
    const [loading, setLoading] = useState(false);

    // 2FA States
    const [isTwoFactorDialogOpen, setIsTwoFactorDialogOpen] = useState(false);
    const [twoFactorStep, setTwoFactorStep] = useState<"intro" | "qr" | "verify">("intro");
    const [qrCode, setQrCode] = useState("");
    const [twoFactorOTP, setTwoFactorOTP] = useState("");
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);

    // Passkey States
    const [passkeys, setPasskeys] = useState<any[]>([]);
    const [passkeyName, setPasskeyName] = useState("");

    // Password Confirmation States
    const [isConfirmPasswordOpen, setIsConfirmPasswordOpen] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    useEffect(() => {
        if (session?.user) {
            setIsTwoFactorEnabled(!!session.user.twoFactorEnabled);
            fetchPasskeys();
        }
    }, [session]);

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

    const handleEnableTwoFactor = async () => {
        setLoading(true);
        const {data, error} = await authClient.twoFactor.enable({
            issuer: "Solar",
        });
        setLoading(false);

        if (error) {
            toast.error(error.message || "Erreur lors de l'activation de l'A2F");
        } else if (data) {
            setQrCode(data.totpURI);
            setTwoFactorStep("qr");
        }
    };

    const handleVerifyTwoFactor = async () => {
        setLoading(true);
        const {error} = await authClient.twoFactor.verifyTotp({
            code: twoFactorOTP,
        });
        setLoading(false);

        if (confirmPassword) setConfirmPassword("");

        if (error) {
            toast.error(error.message || "Code invalide");
        } else {
            toast.success("A2F activée avec succès");
            setIsTwoFactorEnabled(true);
            setIsTwoFactorDialogOpen(false);
            setTwoFactorStep("intro");
            setTwoFactorOTP("");
        }
    };

    const handleDisableTwoFactor = async () => {
        setLoading(true);
        const {error} = await authClient.twoFactor.disable({
            password: confirmPassword || undefined,
        });
        setLoading(false);

        if (confirmPassword) setConfirmPassword("");

        if (error) {
            if (error.status === 401 || error.message?.includes("fresh")) {
                return withPassword(handleDisableTwoFactor);
            }
            toast.error(error.message || "Erreur lors de la désactivation");
        } else {
            toast.success("A2F désactivée");
            setIsTwoFactorEnabled(false);
        }
    };

    const withPassword = (action: () => void) => {
        setPendingAction(() => action);
        setIsConfirmPasswordOpen(true);
    };

    const handleConfirmPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmPassword) return;
        setIsConfirmPasswordOpen(false);
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
    };

    const handleAddPasskey = async () => {
        setLoading(true);
        const {error} = await authClient.passkey.addPasskey({
            name: passkeyName || "Ma clé de sécurité",
        });
        setLoading(false);

        if (error) {
            if (error.status === 401 || error.message?.includes("fresh")) {
                return withPassword(handleAddPasskey);
            }
            toast.error(error.message || "Erreur lors de l'ajout de la clé");
        } else {
            toast.success("Clé de sécurité ajoutée");
            setPasskeyName("");
            fetchPasskeys();
            setConfirmPassword("");
        }
    };

    const handleDeletePasskey = async (id: string) => {
        const {error} = await authClient.passkey.deletePasskey({
            id,
        });

        if (error) {
            toast.error(error.message || "Erreur lors de la suppression");
        } else {
            toast.success("Clé supprimée");
            fetchPasskeys();
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

                    {/* Account Tab */}
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
                                                onClick={() => setIsTwoFactorDialogOpen(true)}>
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

                        <Card className="border-destructive/20">
                            <CardHeader>
                                <CardTitle className="text-destructive">Zone de danger</CardTitle>
                                <CardDescription>Actions irréversibles concernant votre compte.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="destructive" className="gap-2">
                                    <Trash2 className="h-4 w-4"/>
                                    Supprimer mon compte
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* A2F Dialog */}
            <Dialog open={isTwoFactorDialogOpen} onOpenChange={setIsTwoFactorDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configurer l'authentification à deux facteurs</DialogTitle>
                        <DialogDescription>
                            Sécurisez votre compte Solar en ajoutant une validation via application TOTP (Google
                            Authenticator, Authy, etc.).
                        </DialogDescription>
                    </DialogHeader>

                    {twoFactorStep === "intro" && (
                        <div className="space-y-4 py-4">
                            <p className="text-sm">En activant l'A2F, un code à 6 chiffres vous sera demandé à chaque
                                connexion.</p>
                            <Button className="w-full" onClick={handleEnableTwoFactor} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Commencer la configuration
                            </Button>
                        </div>
                    )}

                    {twoFactorStep === "qr" && (
                        <div className="space-y-4 py-4 flex flex-col items-center">
                            <div className="bg-white p-4 rounded-lg border-2 border-primary/20">
                                {/* Normally we'd use a QR code library, here we use a placeholder or the raw URI if user can't scan */}
                                <QrCode className="h-40 w-40 text-primary"/>
                            </div>
                            <p className="text-xs text-center text-muted-foreground px-4">
                                Scannez ce QR Code avec votre application d'authentification.<br/>
                                Si vous ne pouvez pas scanner, voici le lien : <br/>
                                <span className="font-mono break-all">{qrCode}</span>
                            </p>
                            <Button className="w-full" onClick={() => setTwoFactorStep("verify")}>
                                J'ai scanné le code
                            </Button>
                        </div>
                    )}

                    {twoFactorStep === "verify" && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp">Code de vérification</Label>
                                <Input
                                    id="otp"
                                    placeholder="000000"
                                    value={twoFactorOTP}
                                    onChange={(e) => setTwoFactorOTP(e.target.value)}
                                    maxLength={6}
                                />
                            </div>
                            <Button className="w-full" onClick={handleVerifyTwoFactor}
                                    disabled={loading || twoFactorOTP.length < 6}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Vérifier et activer
                            </Button>
                        </div>
                    )}
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
                            <Button type="submit" disabled={!confirmPassword}>
                                Confirmer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Page>
    );
}
