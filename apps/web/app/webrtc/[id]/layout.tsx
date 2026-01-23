import {constructMetadata} from "@/lib/metadata";
import {ReactNode} from "react";

export const metadata = constructMetadata({
    title: "Appel Vocal",
    noIndex: true,
});

export default function WebRTCLayout({children}: { children: ReactNode }) {
    return children;
}
