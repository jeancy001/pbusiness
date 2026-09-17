import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors [&_svg]:size-3',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[#064E3B]/10 text-[#064E3B] dark:bg-emerald-950/50 dark:text-emerald-400',

        brand:
          'border-transparent bg-[#064E3B]/15 text-[#064E3B] dark:bg-emerald-950/50 dark:text-emerald-400',

        secondary:
          'border-transparent bg-secondary text-secondary-foreground dark:bg-emerald-950/30 dark:text-emerald-300',

        outline:
          'border-[#064E3B]/25 text-[#064E3B] hover:bg-[#064E3B]/5 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40',

        success:
          'border-transparent bg-success/15 text-success',

        warning:
          'border-transparent bg-warning/20 text-warning-foreground dark:text-warning',

        destructive:
          'border-transparent bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }