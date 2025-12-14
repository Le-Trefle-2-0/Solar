import type {Metadata, Viewport} from "next"
import {Geist, Geist_Mono} from "next/font/google"
import type {ReactNode} from "react"

import "./globals.css"

import {config} from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import {Providers} from "./providers"

config.autoAddCss = false

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"]
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"]
})

export const metadata: Metadata = {
    title: "Solar - Logiciel d'écoutes",
    description: "Application de prise en charge d'écoutes anonymes pour Le Trèfle 2.0",
    icons: {
        icon: "/favicon.ico",
        apple: "/logo.svg"
    }
}

export const viewport: Viewport = {
    initialScale: 1,
    viewportFit: "cover",
    width: "device-width",
    themeColor: [
        {media: "(prefers-color-scheme: light)", color: "oklch(1 0 0)"},
        {media: "(prefers-color-scheme: dark)", color: "oklch(0.145 0 0)"}
    ]
}

export default function RootLayout({
                                       children
                                   }: Readonly<{
    children: ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
            <div className="flex min-h-svh flex-col">
                {children}
            </div>
        </Providers>
        </body>
        </html>
    )
}