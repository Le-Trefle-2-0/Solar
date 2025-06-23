"use client";
import {Dashboard, organizations, routeProtection, users,} from "better-auth-dashboard/react";
import * as components from "@/components/ui"; // that index.ts file you made for shadCn componentns.
import {authClient} from "@/lib/auth-client"; // your better-auth auth client.

export default ({params}: { params: Promise<{ all: string }> }) => {
    return (
        <Dashboard
            params={params}
            components={components}
            authClient={authClient as any}
            plugins={[users(), organizations(), routeProtection()]}
        />
    );
};