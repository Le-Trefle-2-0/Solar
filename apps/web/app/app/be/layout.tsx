import {constructMetadata} from "@/lib/metadata";
import {ReactNode} from "react";

export const metadata = constructMetadata({
    title: "Chat Bénévoles",
    noIndex: true,
});

export default function BeLayout({children}: { children: ReactNode }) {
    return children;
}
