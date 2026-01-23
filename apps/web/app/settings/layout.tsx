import {constructMetadata} from "@/lib/metadata";
import {ReactNode} from "react";

export const metadata = constructMetadata({
    title: "Paramètres",
    noIndex: true,
});

export default function SettingsLayout({children}: { children: ReactNode }) {
    return children;
}
