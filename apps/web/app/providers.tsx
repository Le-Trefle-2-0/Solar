"use client"

import {AuthUIProvider} from "@daveyplate/better-auth-ui"
import Link from "next/link"
import {useRouter} from "next/navigation"
import type {ReactNode} from "react"

import {authClient} from "@/lib/auth-client"
import {locale} from "@/app/auth/[pathname]/view";
import {Toaster} from "sonner";

export function Providers({children}: { children: ReactNode }) {
    const router = useRouter()

    return (
        <AuthUIProvider
            authClient={authClient}
            navigate={router.push}
            replace={router.replace}
            onSessionChange={() => {
                router.refresh()
            }}
            Link={Link}
            settings={{
                url: "/settings"
            }}
            additionalFields={{
                newsletter: {
                    label: "Lettre d'actualité mensuelle",
                    description: "Souhaitez vous recevoir notre lettre d'actualité ?",
                    required: false,
                    type: "boolean",
                }
            }}
            twoFactor={["totp"]}
            localization={locale}
            signUp={true}
            social={{
                providers: ["discord"]
            }}
            avatar={{
                upload: async (image) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(image);

                    await authClient.updateUser({
                        image: reader.result as string,
                    });

                    return reader.result as string;
                }
            }}
        >
            {children}
            <Toaster richColors position="top-center"/>
        </AuthUIProvider>
    )
}