import {
    ChangeEmailCard,
    ChangePasswordCard,
    ProvidersCard,
    SessionsCard,
    TwoFactorCard,
    UpdateAvatarCard,
    UpdateUsernameCard
} from "@daveyplate/better-auth-ui"
import {locale} from "@/app/auth/[pathname]/view";

export default function SettingsPage() {
    return (
        <div className="flex justify-center py-12 px-4">
            <div className="flex flex-col gap-6 w-full mx-auto py-12 px-4">
                <UpdateAvatarCard localization={locale}/>
                <UpdateUsernameCard localization={locale}/>
                <ChangeEmailCard localization={locale}/>
                <ChangePasswordCard localization={locale}/>
                <TwoFactorCard localization={locale}/>
                <ProvidersCard localization={locale}/>
                <SessionsCard localization={locale}/>
            </div>
        </div>
    )
}