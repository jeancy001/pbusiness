'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/theme/context'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  )
}
