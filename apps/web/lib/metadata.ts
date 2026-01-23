import {Metadata} from 'next'

interface MetadataProps {
    title?: string
    description?: string
    image?: string
    noIndex?: boolean
}

export function constructMetadata({
                                      title = "Le Trèfle 2.0 - Services d'écoute et de soutien moral",
                                      description = "Le Trèfle 2.0 propose des services gratuits d'écoute anonyme et de soutien moral pour votre santé mentale.",
                                      image = "/logo.svg",
                                      noIndex = false
                                  }: MetadataProps = {}): Metadata {
    const seoEnabled = process.env.NEXT_PUBLIC_SEO_ENABLED === 'true'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const defaultTitle = "Le Trèfle 2.0 - Services d'écoute et de soutien moral"
    const fullTitle = title === defaultTitle ? title : `${title} | Le Trèfle 2.0`

    return {
        title: fullTitle,
        description,
        openGraph: {
            title: fullTitle,
            description,
            images: [
                {
                    url: image
                }
            ],
            type: 'website',
            siteName: 'Le Trèfle 2.0'
        },
        twitter: {
            card: "summary_large_image",
            title: fullTitle,
            description,
            images: [image],
            creator: "@letrefle"
        },
        icons: {
            icon: "/favicon.ico",
            shortcut: "/favicon.ico",
            apple: "/logo.svg",
        },
        metadataBase: new URL(appUrl),
        ...((noIndex || !seoEnabled) ? {
            robots: {
                index: false,
                follow: false,
                googleBot: {
                    index: false,
                    follow: false,
                }
            }
        } : {
            robots: {
                index: true,
                follow: true,
            }
        })
    }
}
