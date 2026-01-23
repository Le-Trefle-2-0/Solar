import type {Viewport} from "next"
import {Barlow_Condensed, Geist, Geist_Mono} from "next/font/google"
import type {ReactNode} from "react"

import "./globals.css"

import {config} from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import {Providers} from "./providers"
import {constructMetadata} from "@/lib/metadata"

config.autoAddCss = false

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"]
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"]
})

const barlowCondensed = Barlow_Condensed({
    variable: "--font-barlow-condensed",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"]
})

export const metadata = constructMetadata()

export const viewport: Viewport = {
    initialScale: 1,
    viewportFit: "cover",
    width: "device-width",
    themeColor: [
        {media: "(prefers-color-scheme: light)", color: "#f6f6f6"},
        {media: "(prefers-color-scheme: dark)", color: "#202020"}
    ]
}

export default function RootLayout({
                                       children
                                   }: Readonly<{
    children: ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} ${barlowCondensed.variable} antialiased`}
              suppressHydrationWarning>
        <Providers>
            <div className="flex min-h-svh flex-col">
                {children}
            </div>
        </Providers>
        </body>
        </html>
    )
}