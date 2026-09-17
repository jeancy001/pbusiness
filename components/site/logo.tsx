import Link from "next/link"
import { cn } from "@/lib/utils"
import { PBPayLogo } from "../ui/pb-pay-logo"

export function Logo({
  className,
  href = "/",
}: {
  className?: string
  href?: string
}) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2.5", className)}
      aria-label="P Business Online"
    >
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-[#064E3B] text-white">
        <PBPayLogo className="size-7" />

        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-brand ring-2 ring-background" />
      </span>

      <span className="flex flex-col leading-none">
        <span className="font-display text-[0.95rem] font-bold tracking-tight text-foreground">
          P Business
        </span>

        <span className="text-[0.7rem] font-medium tracking-wide text-muted-foreground">
          ONLINE
        </span>
      </span>
    </Link>
  )
}