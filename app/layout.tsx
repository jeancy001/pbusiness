import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import type React from 'react'
import { Providers } from '@/components/providers'
import { getSession } from '@/lib/auth/session'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'P Business Online — Formations, certificats & solutions numériques',
    template: '%s | P Business Online',
  },
  description:
    'Plateforme professionnelle de formations en ligne, certificats numériques, codes sources et services de développement web, mobile, desktop, SaaS et API.',
  keywords: [
    'formations en ligne',
    'certificats numériques',
    'codes sources',
    'développement web',
    'SaaS',
    'API',
    'P Business Online',
  ],
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaff' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1220' },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()
  const initialUser = session
    ? { id: session.userId, name: session.name, email: session.email, role: session.role }
    : null

  return (
    <html lang="fr" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} bg-background`}>
      <body className="font-sans antialiased">
        <Providers initialUser={initialUser}>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
