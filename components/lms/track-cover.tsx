"use client"

import { useEffect, useRef, useState } from "react"
import { Database } from "lucide-react"

import { cn } from "@/lib/utils"
import { AI_COVER_STYLE, type AiTrack } from "@/lib/lms/catalog"
import { langIcon } from "@/lib/lms/lang-icons"

type TrackRef = Pick<AiTrack, "slug" | "badge" | "kind" | "name">

/** Official logo of a programming course's language (see langIcon). */
export function LangLogo({ icon, className }: { icon: string; className?: string }) {
  if (icon === "database") return <Database className={cn("text-[#00618A]", className)} aria-hidden />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={icon} alt="" className={cn("object-contain", className)} />
}

/** The course's logo when it has one, otherwise its short text badge. */
export function TrackMark({ track, className, logoClassName }: { track: TrackRef; className?: string; logoClassName?: string }) {
  const icon = langIcon(track)
  if (icon) return <LangLogo icon={icon} className={logoClassName ?? className} />
  return <span className={className}>{track.badge}</span>
}

/**
 * AI-generated cover photo of a Linko Academy course. Programming courses
 * also carry their language's real logo. The branded green header with the
 * logo (or badge) shows while the photo loads, or if it can't be made.
 */
export function TrackCover({ track, version, className }: { track: TrackRef; version?: number; className?: string }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading")
  const img = useRef<HTMLImageElement>(null)
  const icon = langIcon(track)

  // A cached image can finish before hydration, so its load event is never seen by React.
  useEffect(() => {
    const el = img.current
    if (el?.complete) setState(el.naturalWidth > 0 ? "ok" : "error")
  }, [track.slug, version])

  return (
    <div className={cn("relative overflow-hidden bg-[#064E3B] text-white", className)}>
      <div aria-hidden className="absolute -right-10 -top-10 size-32 rounded-full bg-emerald-300/20 blur-2xl" />
      {state !== "ok" &&
        (icon ? (
          <span className={cn("absolute inset-0 m-auto flex size-20 items-center justify-center rounded-2xl bg-white shadow-lg", state === "loading" && "animate-pulse")}>
            <LangLogo icon={icon} className="size-12" />
          </span>
        ) : (
          <span
            className={cn(
              "absolute inset-0 m-auto flex h-fit w-fit rounded-xl bg-white/10 px-3 py-2 font-heading font-bold ring-1 ring-white/20",
              track.kind === "language" ? "text-sm" : "font-mono text-lg",
              state === "loading" && "animate-pulse",
            )}
          >
            {track.badge}
          </span>
        ))}
      {state !== "error" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={img}
          src={`/api/academy/cover/${track.slug}?s=${AI_COVER_STYLE}${version ? `&v=${version}` : ""}`}
          alt=""
          loading="lazy"
          onLoad={() => setState("ok")}
          onError={() => setState("error")}
          className={cn("absolute inset-0 size-full object-cover transition-opacity duration-500", state === "ok" ? "opacity-100" : "opacity-0")}
        />
      )}
      {state === "ok" && icon && (
        <span className="absolute bottom-3 left-3 flex size-12 items-center justify-center rounded-xl bg-white/95 shadow-lg ring-1 ring-black/5 backdrop-blur">
          <LangLogo icon={icon} className="size-8" />
        </span>
      )}
    </div>
  )
}
