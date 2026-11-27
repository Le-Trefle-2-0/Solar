"use client";

import {authClient} from "@/lib/auth-client";
import {clearJwtCache} from "@/lib/api";
import {closeSocket} from "@/lib/socket";

/**
 * Signing out also drops what the browser keeps for the API and the realtime service: the
 * cached JWT and the open socket (#276). The services also check the session server-side.
 */
export async function signOutEverywhere(onSuccess?: () => void) {
    clearJwtCache();
    closeSocket();
    await authClient.signOut({fetchOptions: {onSuccess}});
}
