"use client"

import { BadgeCheck } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

/** Blue check shown next to the name of a Certified Teacher. */
export function CertifiedBadge({ className, label = false }: { className?: string; label?: boolean }) {
  const { locale } = useI18n()
  const text = locale === "fr" ? "Formateur certifié" : "Certified teacher"
  return (
    <span className={cn("inline-flex items-center gap-1 align-middle text-[#1D9BF0]", className)} title={text}>
      <BadgeCheck className="size-4 shrink-0 fill-[#1D9BF0] text-white" aria-hidden />
      {label ? <span className="text-xs font-medium">{text}</span> : <span className="sr-only">{text}</span>}
    </span>
  )
}

/** Teacher name followed by the blue check when certified. */
export function TeacherName({ name, certified, className }: { name: string; certified?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {name}
      {certified && <CertifiedBadge />}
    </span>
  )
}
