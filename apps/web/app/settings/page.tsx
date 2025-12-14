"use client";
import {
    APIKeysCard,
    ChangeEmailCard,
    ChangePasswordCard,
    ProvidersCard,
    SessionsCard,
    TwoFactorCard,
    UpdateAvatarCard,
    UpdateUsernameCard
} from "@daveyplate/better-auth-ui"
import {locale} from "@/app/auth/[pathname]/view";
import {CircleX, KeyRound, UserPen} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect} from "react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";

export default function SettingsPage() {
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                router.back();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [router]);

    return (
        <Tabs defaultValue="account" className="w-full">
            <div className="fixed top-6 right-6 cursor-pointer" onClick={() => router.back()}>
                <CircleX color="#202020"/>
            </div>
            <div className="flex justify-around align-middle pt-6">
                <TabsList>
                    <TabsTrigger value="account">
                        <UserPen/> Compte
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <KeyRound/> Sécurité
                    </TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="account">
                <div className="flex flex-col gap-6 w-full mx-auto p-12">
                    <UpdateAvatarCard localization={locale}/>
                    <UpdateUsernameCard localization={locale}/>
                </div>
            </TabsContent>
            <TabsContent value="security">
                <div className="flex flex-col gap-6 w-full mx-auto p-12">
                    <ChangeEmailCard localization={locale}/>
                    <ChangePasswordCard localization={locale}/>
                    <TwoFactorCard localization={locale}/>
                    <ProvidersCard localization={locale}/>
                    <SessionsCard localization={locale}/>
                    <APIKeysCard localization={locale}/>
                </div>
            </TabsContent>
        </Tabs>
    )
}