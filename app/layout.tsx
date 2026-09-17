import { Analytics } from "@vercel/analytics/next"

import type { Metadata, Viewport } from "next"

import { Inter, Space_Grotesk } from "next/font/google"

import type React from "react"

import { Providers } from "@/components/providers"
import { PBPayLogo } from "@/components/ui/pb-pay-logo"
import { getSession } from "@/lib/auth/session"

import "./globals.css"

// ============================================================
// PB-PAY BRAND
// ============================================================

const PB_PAY_GREEN = "#064E3B"
const PB_PAY_GREEN_DARK = "#053D2E"

// ============================================================
// FONTS
// ============================================================

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

// ============================================================
// SITE CONFIGURATION
// ============================================================

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://www.p-bonline.dev"

const siteName = "P Business Online"

const siteDescription =
  "Plateforme professionnelle de formations en ligne, certificats numériques, codes sources et solutions de développement web, mobile, desktop, SaaS et API."

// ============================================================
// METADATA
// ============================================================

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  applicationName: siteName,

  title: {
    default:
      "P Business Online — Formations, certificats & solutions numériques",
    template: "%s | P Business Online",
  },

  description: siteDescription,

  keywords: [
    "P Business Online",
    "PB Online",
    "PB-pay",
    "formations en ligne",
    "formation professionnelle",
    "certificats numériques",
    "certification en ligne",
    "cours en ligne",
    "codes sources",
    "développement web",
    "développement mobile",
    "développement desktop",
    "création de site web",
    "application mobile",
    "SaaS",
    "API",
    "solutions numériques",
    "intelligence artificielle",
    "technologie",
  ],

  generator: siteName,
  category: "Technology",

  authors: [
    {
      name: siteName,
      url: siteUrl,
    },
  ],

  creator: siteName,
  publisher: siteName,

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  alternates: {
    canonical: "/",
  },

  // ============================================================
  // OPEN GRAPH
  // ============================================================

  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName,

    title:
      "P Business Online — Formations, certificats & solutions numériques",

    description: siteDescription,

    images: [
      {
        url: "/web-logo.png",
        width: 1200,
        height: 630,
        alt: "PB-pay — P Business Online",
      },
    ],
  },

  // ============================================================
  // X / TWITTER
  // ============================================================

  twitter: {
    card: "summary_large_image",

    title:
      "P Business Online — Formations, certificats & solutions numériques",

    description: siteDescription,

    images: [
      {
        url: "/web-logo.png",
        alt: "PB-pay — P Business Online",
      },
    ],

    creator: "@YOUR_TWITTER_USERNAME",
    site: "@YOUR_TWITTER_USERNAME",
  },

  // ============================================================
  // ROBOTS / SEO
  // ============================================================

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ============================================================
  // ICONS
  // ============================================================

  icons: {
    icon: [
      {
        url: "/web-logo.png",
        sizes: "any",
      },
      {
        url: "/web-logo.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],

    apple: [
      {
        url: "/web-logo.png",
        sizes: "180x180",
      },
    ],

    shortcut: ["/web-logo.png"],
  },

  // ============================================================
  // PWA
  // ============================================================

  manifest: "/manifest.webmanifest",
}

// ============================================================
// VIEWPORT
// ============================================================

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,

  colorScheme: "light dark",

  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: PB_PAY_GREEN,
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: PB_PAY_GREEN_DARK,
    },
  ],
}

// ============================================================
// ROOT LAYOUT
// ============================================================

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  const initialUser = session
    ? {
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
      }
    : null

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <Providers initialUser={initialUser}>
          {/* PB-pay global brand mark */}
          <div className="sr-only" aria-label="PB-pay">
            <PBPayLogo className="size-7" />
          </div>

          {children}
        </Providers>

        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}