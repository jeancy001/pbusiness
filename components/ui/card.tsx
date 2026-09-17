import type * as React from "react"

import { cn } from "@/lib/utils"

// ============================================================
// PB-PAY CARD
// ============================================================

function Card({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        `
          flex
          flex-col
          rounded-2xl
          border
          border-border
          bg-card
          text-card-foreground
          shadow-sm
          transition-all
          duration-200

          hover:border-[#064E3B]/20
          hover:shadow-md

          dark:hover:border-emerald-800/60
        `,
        className,
      )}
      {...props}
    />
  )
}

// ============================================================
// CARD HEADER
// ============================================================

function CardHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5 p-6",
        className,
      )}
      {...props}
    />
  )
}

// ============================================================
// CARD TITLE
// ============================================================

function CardTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        `
          font-display
          text-lg
          font-semibold
          leading-tight
          tracking-tight
          transition-colors

          group-hover:text-[#064E3B]

          dark:group-hover:text-emerald-400
        `,
        className,
      )}
      {...props}
    />
  )
}

// ============================================================
// CARD DESCRIPTION
// ============================================================

function CardDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-sm leading-relaxed text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

// ============================================================
// CARD CONTENT
// ============================================================

function CardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "p-6 pt-0",
        className,
      )}
      {...props}
    />
  )
}

// ============================================================
// CARD FOOTER
// ============================================================

function CardFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        `
          flex
          items-center
          gap-2
          border-t
          border-transparent
          p-6
          pt-4

          group-hover:border-[#064E3B]/10

          dark:group-hover:border-emerald-900/40
        `,
        className,
      )}
      {...props}
    />
  )
}

// ============================================================
// EXPORTS
// ============================================================

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
}