"use client";

import {Suspense, useCallback, useEffect, useState} from "react";
import Image from "next/image";
import {useParams, useSearchParams} from "next/navigation";
import {Loader2} from "lucide-react";
import logo from "@/public/logo.svg";
import {VisitorCall} from "@/components/voice/visitor-call";

/** Same fallback as lib/api.ts (the visitor is not signed in). */
const apiUrl = () => (process.env.NEXT_PUBLIC_API_URL || window.location.origin.replace(":3000", ":3001")).replace(/\/$/, "");

type Token = {channelId: string; exp: number; t: string};
type LinkState = {state: "checking"} | {state: "valid"; token: Token} | {state: "ended"} | {state: "invalid"};

/**
 * Voice call page for people who reach the association on Discord: the bot sends them this
 * link once the volunteer switches their ticket to voice. The link is signed for this ticket
 * and one hour; the call is one to one with the volunteer, through the association's server.
 */
function VoiceCallPage() {
    const {channelId} = useParams<{channelId: string}>();
    const search = useSearchParams();
    const [link, setLink] = useState<LinkState>({state: "checking"});

    useEffect(() => {
        const q = new URLSearchParams({c: channelId, e: search.get("e") || "", t: search.get("t") || ""});
        fetch(`${apiUrl()}/v1/voice/link?${q}`, {cache: "no-store"})
            .then(r => r.json())
            .then((d: {valid?: boolean; ended?: boolean; token?: Token}) => {
                if (d.valid && d.token) setLink({state: "valid", token: d.token});
                else setLink({state: d.ended ? "ended" : "invalid"});
            })
            .catch(() => setLink({state: "invalid"}));
    }, [channelId, search]);

    const getToken = useCallback(async () => {
        if (link.state !== "valid") throw new Error("invalid");
        return link.token;
    }, [link]);

    return (
        <main className="flex min-h-svh flex-col items-center bg-background px-4 py-10 sm:justify-center">
            <div className="w-full max-w-md">
                <div className="mb-8 flex items-center gap-3">
                    <Image src={logo} alt="" height={40} width={40}/>
                    <span className="font-semibold">Le Trèfle 2.0</span>
                </div>

                <h1 className="text-2xl font-semibold leading-snug">Appel avec un bénévole</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Vous restez anonyme : le bénévole ne voit ni votre nom, ni votre numéro, ni votre adresse.
                    Gardez Discord ouvert si vous voulez continuer à écrire en même temps.
                </p>

                <div className="mt-8">
                    {link.state === "checking" && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin"/> Vérification du lien…
                        </p>
                    )}
                    {link.state === "valid" && <VisitorCall getToken={getToken}/>}
                    {link.state === "ended" && (
                        <div className="rounded-2xl border p-5 text-sm leading-relaxed">
                            <p className="font-medium">Cet appel n&apos;est plus disponible.</p>
                            <p className="mt-1 text-muted-foreground">
                                L&apos;écoute est terminée. Vous pouvez en ouvrir une nouvelle depuis Discord.
                            </p>
                        </div>
                    )}
                    {link.state === "invalid" && (
                        <div className="rounded-2xl border p-5 text-sm leading-relaxed">
                            <p className="font-medium">Ce lien n&apos;est pas valable.</p>
                            <p className="mt-1 text-muted-foreground">
                                Il a peut-être expiré (il est valable une heure). Demandez un nouveau lien au bénévole sur Discord.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function Page() {
    return (
        <Suspense>
            <VoiceCallPage/>
        </Suspense>
    );
}
