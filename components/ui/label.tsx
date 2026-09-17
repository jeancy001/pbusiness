import type * as React from 'react'

import { cn } from '@/lib/utils'

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot="label"
      className={cn(
        'text-sm font-medium leading-none text-foreground select-none',
        'transition-colors duration-150',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        'peer-focus:text-[#064E3B] dark:peer-focus:text-emerald-400',
        className,
      )}
      {...props}
    />
  )
}

export { Label }