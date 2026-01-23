import {constructMetadata} from "@/lib/metadata";
import {ReactNode} from "react";

export const metadata = constructMetadata({
    title: "Administration",
    noIndex: true,
});

export default function AdminLayout({children}: { children: ReactNode }) {
    return children;
}
