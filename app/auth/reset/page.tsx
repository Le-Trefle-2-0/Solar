"use client"

import {Button} from "@/components/ui/button";
import {CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {useState} from "react";
import {Loader2} from "lucide-react";
import {resetPassword} from "@/lib/auth-client";
import {useRouter, useSearchParams} from "next/navigation";
import {toast} from "sonner";

export default function SignIn() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    if (!token) {
        return router.push("/auth/signin");
    }

    return (
        <div>
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">Réinitialisation du mot de passe</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                    Indiquez le nouveau mot de passe
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Mot de passe</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Mot de passe"
                            required
                            onChange={(e) => {
                                setPassword(e.target.value);
                            }}
                            value={password}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                        onClick={async () => {
                            setLoading(true);
                            const { data, error } = await resetPassword(
                                {
                                    newPassword: password,
                                    token,
                                },
                                {
                                    onError: (error) => {
                                        toast.error(error.error.message);
                                        setLoading(false);
                                    },
                                    onSuccess: () => {
                                        toast.success("Mot de passe réinitialisé");
                                        setLoading(false);
                                        setTimeout(() => {
                                            router.push('/auth/signin');
                                        }, 1000)
                                    }
                                }
                            );
                        }}
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <p> Récupération </p>
                        )}
                    </Button>




                </div>
            </CardContent>

        </div>
    );
}