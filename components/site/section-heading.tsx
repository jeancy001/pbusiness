import { cn } from "@/lib/utils"

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  action,
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: "left" | "center"
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#064E3B] dark:text-emerald-400">{eyebrow}</p>
        )}
        <h2 className="mt-2 text-balance font-heading text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
        {subtitle && <p className="mt-3 text-pretty text-base leading-relaxed text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
