"use client"

import {Button} from "@/components/ui/button";
import {CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {useState} from "react";
import {Loader2} from "lucide-react";
import {signIn} from "@/lib/auth-client";
import Link from "next/link";

export default function SignIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);


    return (
        <div>
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">Connexion</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                    Entrez votre courriel et mot de passe
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Courriel</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            onChange={(e) => {
                                setEmail(e.target.value);
                            }}
                            value={email}
                        />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Link
                                href="/auth/recover"
                                className="ml-auto inline-block text-sm underline"
                            >
                                Mot de passe oublié ?
                            </Link>
                        </div>

                        <Input
                            id="password"
                            type="password"
                            placeholder="Mot de passe"
                            autoComplete="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>





                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                        onClick={async () => {
                            await signIn.email(
                                {
                                    email,
                                    password,
                                    rememberMe: true,
                                    callbackURL: "/dashboard",
                                },
                                {
                                    onRequest: (ctx) => {
                                        setLoading(true);
                                    },
                                    onResponse: (ctx) => {
                                        setLoading(false);
                                    },
                                },
                            );
                        }}
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <p> Connexion </p>
                        )}
                    </Button>




                </div>
            </CardContent>

        </div>
    );
}