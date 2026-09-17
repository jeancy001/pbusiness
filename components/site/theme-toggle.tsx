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
      aria-label={
        theme === 'dark'
          ? 'Activer le mode clair'
          : 'Activer le mode sombre'
      }
      className="
        text-[#064E3B]
        transition-all

        hover:bg-[#064E3B]
        hover:text-white

        dark:text-emerald-400
        dark:hover:bg-[#064E3B]
        dark:hover:text-white
      "
    >
      {theme === 'dark' ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  )
}