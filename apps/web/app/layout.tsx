import type {Viewport} from "next"
import {Geist, Geist_Mono} from "next/font/google"
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
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <Providers>
            <div className="flex min-h-svh flex-col">
                {children}
            </div>
        </Providers>
        </body>
        </html>
    )
}