import {constructMetadata} from "@/lib/metadata";
import {ReactNode} from "react";

export const metadata = constructMetadata({
    title: "Planning",
    noIndex: true,
});

export default function PlanningLayout({children}: { children: ReactNode }) {
    return children;
}
