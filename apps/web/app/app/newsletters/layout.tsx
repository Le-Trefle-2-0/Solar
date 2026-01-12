import {constructMetadata} from "@/lib/metadata";
import {ReactNode} from "react";

export const metadata = constructMetadata({
    title: "Newsletters",
    noIndex: true,
});

export default function NewslettersLayout({children}: { children: ReactNode }) {
    return children;
}
