"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Loader2, Key } from "lucide-react";
import { resetPassword } from "@/lib/auth-client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function SignIn() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
        return router.push("/auth/sigin");
    }


    return (
        <Card className="max-w-md">
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
                            const { data, error } = await resetPassword({
                                newPassword: "password1234",
                                token,
                            });
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

        </Card>
    );
}