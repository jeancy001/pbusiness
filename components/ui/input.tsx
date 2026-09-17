import type * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all duration-150',

        'placeholder:text-muted-foreground',

        'hover:border-[#064E3B]/40',

        'focus-visible:border-[#064E3B] focus-visible:ring-2 focus-visible:ring-[#064E3B]/20 focus-visible:outline-none',

        'disabled:cursor-not-allowed disabled:opacity-50',

        'file:border-0 file:bg-transparent file:text-sm file:font-medium',

        'dark:bg-input/30 dark:hover:border-emerald-800',
        'dark:focus-visible:border-emerald-500 dark:focus-visible:ring-emerald-500/20',

        className,
      )}
      {...props}
    />
  )
}

export { Input }