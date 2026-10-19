import type { Metadata } from "next"
import localFont from "next/font/local"

import { brandFile } from "@/data/assets"
import { AppProviders } from "@/providers/app-providers"

import "./globals.css"

/*
 * The three designer fonts are served from this app (src/app/fonts), not from
 * Google Fonts: no request leaves the site and the build works offline.
 * Files: the open-source variable fonts (SIL Open Font License, licences next
 * to the files), latin subset, the same subset the Google setup loaded.
 * globals.css maps these variables to --font-display / --font-heading,
 * --font-body / --font-sans and --font-mono.
 */
const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk-latin-wght.woff2",
  weight: "300 700",
  variable: "--font-space-grotesk",
  display: "swap",
})

const inter = localFont({
  src: "./fonts/inter-latin-wght.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono-latin-wght.woff2",
  weight: "100 800",
  variable: "--font-jetbrains-mono",
  display: "swap",
})

// Title and description are index.html's <title> and <meta name="description">.
export const metadata: Metadata = {
  title: {
    default: "Find your football academy · Golafly Academy",
    template: "%s · Golafly Academy",
  },
  description:
    "Golafly Academy — compare verified football academy programs across Europe by age, start date and fees, then apply to join and track the decision in one place.",
  /* The prototype's own icon files (every page's <head> in academy-marketplace) */
  icons: {
    icon: [
      { url: brandFile("academy-crest.svg"), type: "image/svg+xml" },
      {
        url: brandFile("academy-crest-128.png"),
        type: "image/png",
        sizes: "128x128",
      },
    ],
    apple: brandFile("academy-crest-180.png"),
  },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // Next.js 16: keeps globals.css smooth scrolling, without it on route changes
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
