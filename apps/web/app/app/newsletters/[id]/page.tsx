import NewsletterDetailView from "./view";
import {apiFetch} from "@/lib/api";
import {constructMetadata} from "@/lib/metadata";

async function getNewsletter(id: string) {
    try {
        return await apiFetch(`/v1/newsletters/${id}`);
    } catch (e) {
        console.error("Error fetching newsletter for metadata", e);
        return null;
    }
}

export async function generateMetadata({params}: { params: Promise<{ id: string }> }) {
    const {id} = await params;
    const newsletter = await getNewsletter(id);

    return constructMetadata({
        title: newsletter?.title ? `Newsletter: ${newsletter.title}` : "Newsletter",
        noIndex: true,
    });
}

export default function NewsletterDetailPage() {
    return <NewsletterDetailView/>;
}
