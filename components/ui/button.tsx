import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { isValidElement } from "react"

import { cn } from "@/lib/utils"

// ============================================================
// PB-PAY BUTTON VARIANTS
// ============================================================

const buttonVariants = cva(
  `
    group/button
    inline-flex
    shrink-0
    items-center
    justify-center
    rounded-lg
    border
    border-transparent
    bg-clip-padding
    text-sm
    font-medium
    whitespace-nowrap
    transition-all
    outline-none
    select-none

    focus-visible:border-[#064E3B]
    focus-visible:ring-3
    focus-visible:ring-[#064E3B]/30

    active:not-aria-[haspopup]:translate-y-px

    disabled:pointer-events-none
    disabled:opacity-50

    aria-invalid:border-destructive
    aria-invalid:ring-3
    aria-invalid:ring-destructive/20

    dark:aria-invalid:border-destructive/50
    dark:aria-invalid:ring-destructive/40

    [&_svg]:pointer-events-none
    [&_svg]:shrink-0
    [&_svg:not([class*='size-'])]:size-4
  `,
  {
    variants: {
      variant: {

        // ======================================================
        // DEFAULT — PB-PAY GREEN
        // ======================================================

        default: `
          bg-[#064E3B]
          text-white
          shadow-sm

          hover:bg-[#053D2E]

          focus-visible:border-[#064E3B]
          focus-visible:ring-[#064E3B]/30

          dark:bg-[#064E3B]
          dark:text-white
          dark:hover:bg-[#053D2E]
        `,

        // ======================================================
        // OUTLINE
        // ======================================================

        outline: `
          border-[#064E3B]/30
          bg-background
          text-[#064E3B]

          hover:border-[#064E3B]
          hover:bg-[#064E3B]
          hover:text-white

          aria-expanded:border-[#064E3B]
          aria-expanded:bg-[#064E3B]
          aria-expanded:text-white

          dark:border-emerald-800
          dark:bg-background/30
          dark:text-emerald-400

          dark:hover:border-[#064E3B]
          dark:hover:bg-[#064E3B]
          dark:hover:text-white

          dark:aria-expanded:border-[#064E3B]
          dark:aria-expanded:bg-[#064E3B]
          dark:aria-expanded:text-white
        `,

        // ======================================================
        // SECONDARY
        // ======================================================

        secondary: `
          border-[#064E3B]/10
          bg-[#064E3B]/10
          text-[#064E3B]

          hover:bg-[#064E3B]/15
          hover:text-[#053D2E]

          aria-expanded:bg-[#064E3B]/15
          aria-expanded:text-[#053D2E]

          dark:border-emerald-900/40
          dark:bg-emerald-950/40
          dark:text-emerald-400

          dark:hover:bg-[#064E3B]
          dark:hover:text-white
        `,

        // ======================================================
        // GHOST
        // ======================================================

        ghost: `
          text-[#064E3B]

          hover:bg-[#064E3B]/10
          hover:text-[#064E3B]

          aria-expanded:bg-[#064E3B]/10
          aria-expanded:text-[#064E3B]

          dark:text-emerald-400

          dark:hover:bg-emerald-950/40
          dark:hover:text-emerald-300

          dark:aria-expanded:bg-emerald-950/40
          dark:aria-expanded:text-emerald-300
        `,

        // ======================================================
        // DESTRUCTIVE
        // ======================================================

        destructive: `
          bg-destructive/10
          text-destructive

          hover:bg-destructive/20

          focus-visible:border-destructive/40
          focus-visible:ring-destructive/20

          dark:bg-destructive/20
          dark:hover:bg-destructive/30
          dark:focus-visible:ring-destructive/40
        `,

        // ======================================================
        // LINK
        // ======================================================

        link: `
          text-[#064E3B]
          underline-offset-4

          hover:text-[#053D2E]
          hover:underline

          dark:text-emerald-400
          dark:hover:text-emerald-300
        `,
      },

      // ========================================================
      // SIZES
      // ========================================================

      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",

        xs:
          "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",

        sm:
          "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",

        lg:
          "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",

        icon:
          "size-8",

        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",

        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",

        "icon-lg":
          "size-9",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

// ============================================================
// BUTTON
// ============================================================

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  render,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {

  // Support the shadcn-style `asChild` API on top of
  // Base UI's `render` prop.
  const resolvedRender =
    asChild && isValidElement(children)
      ? children
      : render

  return (
    <ButtonPrimitive
      data-slot="button"
      render={resolvedRender}

      // When rendering a non-button element
      // such as Next.js Link, disable the native
      // button assumption.
      nativeButton={
        resolvedRender
          ? false
          : undefined
      }

      className={cn(
        buttonVariants({
          variant,
          size,
          className,
        }),
      )}

      {...props}
    >
      {asChild
        ? undefined
        : children}
    </ButtonPrimitive>
  )
}

// ============================================================
// EXPORTS
// ============================================================

export {
  Button,
  buttonVariants,
}