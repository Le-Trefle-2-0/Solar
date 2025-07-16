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
import {CircleX} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect} from "react";

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
        <div className="flex justify-center py-12 px-4">
            <div className="fixed top-6 right-6 cursor-pointer" onClick={() => router.back()}>
                <CircleX color="#202020"/>
            </div>
            <div className="flex flex-col gap-6 w-full mx-auto p-12">
                <UpdateAvatarCard localization={locale}/>
                <UpdateUsernameCard localization={locale}/>
                <ChangeEmailCard localization={locale}/>
                <ChangePasswordCard localization={locale}/>
                <TwoFactorCard localization={locale}/>
                <ProvidersCard localization={locale}/>
                <SessionsCard localization={locale}/>
                <APIKeysCard localization={locale}/>
            </div>
        </div>
    )
}