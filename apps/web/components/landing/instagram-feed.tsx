"use client";

import {ScrollReveal} from "./scroll-reveal";
import {Button} from "@/components/ui/button";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faInstagram} from "@fortawesome/free-brands-svg-icons";
import {ExternalLink} from "lucide-react";
import Link from "next/link";
import {useEffect} from "react";

// You can find the post ID in the URL of the post on Instagram
// For example: https://www.instagram.com/p/DB_7-p-N3y_/
// The ID is "DB_7-p-N3y_"
const FEATURED_POST_IDS = [
    "C8m8m3dNXYU",
    "C_ipi6ZC6K6",
    "DZ7aG31DjTX"
];

export function InstagramFeed() {
    useEffect(() => {
        // Load Instagram embed script using Next.js compatible way
        const loadScript = () => {
            if (window.instgrm) {
                window.instgrm.Embeds.process();
                return;
            }
            
            if (!document.getElementById("instagram-embed-script")) {
                const script = document.createElement("script");
                script.id = "instagram-embed-script";
                script.src = "https://www.instagram.com/embed.js";
                script.async = true;
                script.onload = () => {
                    if (window.instgrm) {
                        window.instgrm.Embeds.process();
                    }
                };
                document.body.appendChild(script);
            }
        };

        loadScript();
        
        // Re-process on every mount/update just in case
        if (window.instgrm) {
            window.instgrm.Embeds.process();
        }
    }, []);

    return (
        <section className="py-20 bg-muted/30 overflow-hidden">
            <div className="px-4 md:px-8 max-w-7xl mx-auto">
                <ScrollReveal className="text-center mb-12">
                    <h2 className="text-3xl font-semibold tracking-tighter sm:text-4xl md:text-5xl mb-4 font-barlow">
                        Nos dernières actualités
                    </h2>
                    <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto">
                        Découvrez nos dernières actions et la vie de l'association sur Instagram.
                    </p>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {FEATURED_POST_IDS.map((postId, index) => (
                        <ScrollReveal key={postId} animation="slide-up" delay={index * 100}>
                            <div className="rounded-xl overflow-hidden border bg-background shadow-sm min-h-[500px] flex flex-col relative justify-center items-center">
                                <blockquote
                                    className="instagram-media w-full"
                                    data-instgrm-captioned
                                    data-instgrm-permalink={`https://www.instagram.com/p/${postId}/`}
                                    data-instgrm-version="14"
                                    style={{
                                        background: "#FFF",
                                        border: "0",
                                        borderRadius: "3px",
                                        boxShadow: "0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)",
                                        margin: "1px",
                                        padding: "0",
                                        width: "100%",
                                    }}
                                >
                                    <div style={{ padding: "16px" }}>
                                        <Link
                                            href={`https://www.instagram.com/p/${postId}/`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <FontAwesomeIcon icon={faInstagram} className="h-5 w-5" />
                                            <span>Voir le post sur Instagram</span>
                                        </Link>
                                    </div>
                                </blockquote>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>

                <ScrollReveal animation="fade-in" delay={400} className="flex justify-center">
                    <Link href="https://www.instagram.com/letrefle2.0" target="_blank" rel="noopener noreferrer">
                        <Button size="lg" variant="outline" className="gap-2">
                            Voir plus sur Instagram <ExternalLink className="h-4 w-4" />
                        </Button>
                    </Link>
                </ScrollReveal>
            </div>
        </section>
    );
}
