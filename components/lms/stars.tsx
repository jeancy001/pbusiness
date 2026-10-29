"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { rateCourseAction } from "@/lib/lms/actions"
import { cn } from "@/lib/utils"

/** Five stars filled to `value` (0–5), quarter-star precision. */
export function Stars({ value, className, size = "size-3.5" }: { value: number; className?: string; size?: string }) {
  const v = Math.max(0, Math.min(5, Math.round(value * 4) / 4))
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${v.toFixed(1)} / 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, v - i))
        return (
          <span key={i} className={cn("relative inline-block", size)}>
            <Star className={cn("absolute inset-0 text-amber-400/40", size)} aria-hidden />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn("fill-amber-400 text-amber-400", size)} aria-hidden />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

/** Stars plus the average and review count ("4.6 (12)"), or "New" when nobody rated yet. */
export function RatingSummary({ rating, count, className, light }: { rating: number; count?: number; className?: string; light?: boolean }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", className)}>
      <Stars value={rating} />
      {count ? (
        <span className={cn("font-medium tabular-nums", light ? "text-white" : "text-foreground")}>
          {rating.toFixed(1)}
          <span className={cn("ml-1 font-normal", light ? "text-white/70" : "text-muted-foreground")}>({count})</span>
        </span>
      ) : (
        <span className={light ? "text-white/80" : "text-muted-foreground"}>{fr ? "Nouveau" : "New"}</span>
      )}
    </span>
  )
}

/** Clickable 1–5 stars for a student to rate a course they follow. */
export function RateCourse({ kind, slug, initial }: { kind: "formation" | "ai"; slug: string; initial?: number }) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [value, setValue] = useState(initial ?? 0)
  const [hover, setHover] = useState(0)
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const shown = hover || value

  function rate(stars: number) {
    setMsg(null)
    const previous = value
    setValue(stars)
    start(async () => {
      const res = await rateCourseAction({ kind, slug, stars })
      if (!res.ok) {
        setValue(previous)
        return setMsg(res.error)
      }
      setMsg(fr ? "Merci pour votre avis !" : "Thanks for your rating!")
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">{value ? (fr ? "Votre note" : "Your rating") : fr ? "Notez ce cours" : "Rate this course"}</span>
      <span className="inline-flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={pending}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => rate(n)}
            aria-label={`${n} / 5`}
            aria-pressed={value === n}
            className="rounded p-0.5 transition-transform hover:scale-110 disabled:opacity-60"
          >
            <Star className={cn("size-4", n <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
          </button>
        ))}
      </span>
      {msg && <span className="text-muted-foreground">{msg}</span>}
    </div>
  )
}
