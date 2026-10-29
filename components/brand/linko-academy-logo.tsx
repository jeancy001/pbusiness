import { cn } from "@/lib/utils"

// Linko Academy brand. The mark is an "L" interlocked with a chain link
// ("Linko") and a gold dot for certification. Static copies live in
// public/brand/*.svg for emails, PDFs and social images.

export function LinkoAcademyMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("size-9 shrink-0", className)} role="img" aria-label="Linko Academy">
      <rect width="48" height="48" rx="12" fill="#064E3B" />
      <path d="M16 11v17a7 7 0 0 0 7 7h11" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M24 11h6a7 7 0 0 1 7 7v3" fill="none" stroke="#6EE7B7" strokeWidth="5" strokeLinecap="round" />
      <circle cx="37" cy="30.5" r="3.6" fill="#D4A646" />
    </svg>
  )
}

export function LinkoAcademyLogo({ className, tone = "default" }: { className?: string; tone?: "default" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LinkoAcademyMark />
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-[1.05rem] font-bold tracking-tight", tone === "light" ? "text-white" : "text-foreground")}>Linko</span>
        <span className={cn("text-[0.66rem] font-semibold uppercase tracking-[0.22em]", tone === "light" ? "text-emerald-200" : "text-[#064E3B] dark:text-emerald-400")}>
          Academy
        </span>
      </span>
    </span>
  )
}

/** Certification partner seal: LinkoPayroll certifies Linko Academy graduates. */
export function LinkoPayrollSeal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("size-9 shrink-0", className)} role="img" aria-label="LinkoPayroll">
      <circle cx="24" cy="24" r="22" fill="#FBF6EA" stroke="#B8893B" strokeWidth="2" />
      <circle cx="24" cy="24" r="16.5" fill="none" stroke="#B8893B" strokeWidth="1" strokeDasharray="2 2.4" />
      <path d="M16.5 24.5l5 5 10-11" fill="none" stroke="#064E3B" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CertificationPartner({ className, tone = "default" }: { className?: string; tone?: "default" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LinkoPayrollSeal />
      <span className="flex flex-col leading-tight">
        <span className={cn("text-[0.62rem] font-semibold uppercase tracking-[0.18em]", tone === "light" ? "text-emerald-200/80" : "text-muted-foreground")}>
          Certification partner
        </span>
        <span className={cn("font-display text-sm font-bold", tone === "light" ? "text-white" : "text-foreground")}>LinkoPayroll</span>
      </span>
    </span>
  )
}
