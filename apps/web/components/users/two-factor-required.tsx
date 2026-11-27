import Link from "next/link";
import {ShieldAlert} from "lucide-react";

/** Shown while the account's privileged permissions are withheld for lack of 2FA (#17). */
export function TwoFactorRequired() {
    return (
        <div role="alert"
             className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-orange-300 bg-orange-50 py-2 pr-4 pl-14 text-sm text-orange-900">
            <ShieldAlert className="h-4 w-4 shrink-0"/>
            <span>Vos accès à responsabilités sont suspendus tant que la double authentification n&apos;est pas activée.</span>
            <Link href="/app/settings" className="font-semibold underline">Activer la double authentification</Link>
        </div>
    );
}
