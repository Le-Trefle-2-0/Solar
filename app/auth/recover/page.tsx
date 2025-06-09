"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { forgetPassword } from "@/lib/auth-client";
import {toast} from "sonner";

export default function SignIn() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    return (
        <Card className="max-w-md">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                    Indiquez votre adresse courriel pour procéder à la récupération de votre compte
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Courriel</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="email@benevoles.letrefle.org"
                            required
                            onChange={(e) => {
                                setEmail(e.target.value);
                            }}
                            value={email}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                        onClick={async () => {
                            setLoading(true);
                            await forgetPassword(
                                {
                                    email: email,
                                    redirectTo: "/auth/reset"
                                },
                                {
                                    onError: (error) => {
                                        toast.error(error.error.message);
                                        setLoading(false);
                                    },
                                    onSuccess: () => {
                                        toast.success("Lien de réinitialisation envoyé par mail");
                                        setLoading(false);
                                    }
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