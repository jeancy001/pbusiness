"use client"

import { useState } from "react"
import Link from "next/link"
import { MailCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ResetForm() {
  const { t } = useI18n()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  return (
    <div className="rounded-2xl border border-[#064E3B]/15 bg-card p-8 shadow-sm transition-all duration-200 hover:border-[#064E3B]/25 hover:shadow-md dark:border-emerald-800/40 dark:hover:border-emerald-700/60">
      {sent ? (
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#064E3B]/10 text-[#064E3B] dark:bg-emerald-950/50 dark:text-emerald-400">
            <MailCheck className="size-6" />
          </div>

          <h1 className="mt-5 font-heading text-2xl font-bold text-foreground">
            {t("auth.reset.title")}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {email}
          </p>

          {/* Back to Login */}
          <Button
            className="mt-6 w-full"
            render={<Link href="/login" />}
          >
            {t("nav.login")}
          </Button>
        </div>
      ) : (
        <>
          {/* Header */}
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {t("auth.reset.title")}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {t("auth.reset.subtitle")}
          </p>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSent(true)
            }}
            className="mt-6 flex flex-col gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="email">
                {t("auth.email")}
              </Label>

              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-2 w-full"
            >
              {t("auth.reset.action")}
            </Button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-[#064E3B] transition-colors hover:text-[#053D2E] hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              {t("nav.login")}
            </Link>
          </p>
        </>
      )}
    </div>
  )
}