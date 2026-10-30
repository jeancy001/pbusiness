"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/** Password field with a show/hide toggle. */
export function PasswordInput({ className, ...props }: Omit<React.ComponentProps<typeof Input>, "type">) {
  const { locale } = useI18n()
  const fr = locale === "fr"
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className={cn("pr-11", className)} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? (fr ? "Masquer le mot de passe" : "Hide password") : fr ? "Afficher le mot de passe" : "Show password"}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-[#064E3B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30 dark:hover:text-emerald-400"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

/** Six-digit code field: numeric keyboard, one-time-code autofill. */
export function CodeInput({ className, ...props }: Omit<React.ComponentProps<typeof Input>, "type">) {
  return (
    <Input
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{3} ?\d{3}"
      maxLength={7}
      placeholder="123 456"
      {...props}
      type="text"
      className={cn("text-center font-mono text-xl tracking-[0.4em] placeholder:tracking-[0.4em]", className)}
    />
  )
}
