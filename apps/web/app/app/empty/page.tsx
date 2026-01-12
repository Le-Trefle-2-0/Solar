import {constructMetadata} from "@/lib/metadata";

export const metadata = constructMetadata({
    title: "En attente",
    noIndex: true,
});

export default function empty() {
    return (
        <></>
    )
}