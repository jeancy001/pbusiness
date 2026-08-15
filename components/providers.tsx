'use client'

import type React from 'react'
import { AuthProvider, type SessionUser } from '@/lib/auth/context'
import { LanguageProvider } from '@/lib/i18n/context'
import { ThemeProvider } from '@/lib/theme/context'

export function Providers({
  children,
  initialUser = null,
}: {
  children: React.ReactNode
  initialUser?: SessionUser | null
}) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider initialUser={initialUser}>{children}</AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
