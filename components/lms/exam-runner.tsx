"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Award, CheckCircle2, Download, RotateCcw, ShieldCheck, Trophy, XCircle } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { localize, type Formation } from "@/lib/mock-data"
import { submitAiExamAction, submitExamAction } from "@/lib/lms/actions"
import { CERTIFICATE_PRICE_USD, CERTIFIER_NAME } from "@/lib/lms/catalog"
import { CheckoutDialog } from "@/components/payments/checkout-dialog"
import { EmptyState, FormError } from "@/components/lms/ui"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const primaryBtn = "bg-[#064E3B] text-white shadow-sm hover:bg-[#053D2E] dark:bg-emerald-700 dark:hover:bg-emerald-800"

type Question = { id: string; prompt: string; options: string[] }
type Result = { score: number; passed: boolean }

export function ExamRunner({
  course,
  mode = "course",
  questions,
  passScore,
  previous,
  certificateCode: initialCode,
}: {
  course: Pick<Formation, "slug" | "title">
  /** "ai": Linko Academy final exam — passing issues the certificate directly. */
  mode?: "course" | "ai"
  questions: Question[] | null
  passScore: number
  previous: Result | null
  certificateCode: string | null
}) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<Result | null>(previous?.passed ? previous : null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [certificateCode, setCertificateCode] = useState(initialCode)

  const answered = Object.keys(answers).length
  const total = questions?.length ?? 0

  function submit() {
    setError(null)
    start(async () => {
      const res = await (mode === "ai" ? submitAiExamAction : submitExamAction)({ slug: course.slug, answers })
      if (!res.ok) return setError(res.error)
      setResult(res.data!)
      const code = (res.data as { certificateCode?: string }).certificateCode
      if (code) setCertificateCode(code)
      window.scrollTo({ top: 0, behavior: "smooth" })
    })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#064E3B] dark:text-emerald-400">{t("lms.certification")}</p>
      <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">{localize(course.title, locale)}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("teacher.exam")} · {total} questions · {t("lms.passMark")} {passScore}%
      </p>

      {result ? (
        <ResultCard
          result={result}
          passScore={passScore}
          slug={course.slug}
          certificateCode={certificateCode}
          includesCertificate={mode === "ai"}
          onRetry={() => {
            setResult(null)
            setAnswers({})
          }}
          onCertified={() => router.refresh()}
        />
      ) : !questions ? (
        <div className="mt-8">
          <EmptyState icon={Trophy} title={t("common.comingSoon")}>
            {locale === "fr" ? "L'examen de ce cours n'est pas encore disponible." : "The exam for this course is not available yet."}
          </EmptyState>
        </div>
      ) : (
        <>
          {previous && !previous.passed && (
            <p className="mt-6 rounded-lg border border-warning/40 bg-warning/10 px-4 py-2 text-sm">
              {t("lms.examFailed")}: {previous.score}%
            </p>
          )}
          <ol className="mt-8 space-y-5">
            {questions.map((q, i) => (
              <li key={q.id} className="rounded-2xl border border-border bg-card p-5">
                <p className="font-medium">
                  <span className="mr-2 text-muted-foreground tabular-nums">{i + 1}.</span>
                  {q.prompt}
                </p>
                <div className="mt-4 grid gap-2">
                  {q.options.map((opt, k) => {
                    const selected = answers[q.id] === k
                    return (
                      <label
                        key={k}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors",
                          selected
                            ? "border-[#064E3B] bg-[#064E3B]/5 dark:border-emerald-500 dark:bg-emerald-950/40"
                            : "border-border hover:border-[#064E3B]/40",
                        )}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={selected}
                          onChange={() => setAnswers((a) => ({ ...a, [q.id]: k }))}
                          className="accent-[#064E3B]"
                        />
                        {opt}
                      </label>
                    )
                  })}
                </div>
              </li>
            ))}
          </ol>

          <div className="sticky bottom-4 mt-8 flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
            <span className="text-sm text-muted-foreground tabular-nums">
              {answered}/{total}
            </span>
            <Button onClick={submit} disabled={pending || answered < total} className={primaryBtn}>
              {pending ? t("common.loading") : t("lms.submit")}
            </Button>
          </div>
          <div className="mt-3">
            <FormError message={error} />
          </div>
        </>
      )}
    </div>
  )
}

function ResultCard({
  result,
  passScore,
  slug,
  certificateCode,
  includesCertificate,
  onRetry,
  onCertified,
}: {
  result: Result
  passScore: number
  slug: string
  certificateCode: string | null
  /** AI courses: the certificate is issued on passing, there is no separate fee. */
  includesCertificate: boolean
  onRetry: () => void
  onCertified: () => void
}) {
  const { t, locale } = useI18n()

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
      <div className={cn("flex items-center gap-4 p-6", result.passed ? "bg-success/10" : "bg-destructive/5")}>
        {result.passed ? <CheckCircle2 className="size-10 text-success" /> : <XCircle className="size-10 text-destructive" />}
        <div>
          <p className="font-heading text-xl font-semibold">{result.passed ? t("lms.examPassed") : t("lms.examFailed")}</p>
          <p className="text-sm text-muted-foreground">
            {result.score}% · {t("lms.passMark")} {passScore}%
          </p>
        </div>
        <span className="ml-auto font-heading text-4xl font-bold tabular-nums">{result.score}%</span>
      </div>

      <div className="p-6">
        {!result.passed ? (
          <Button onClick={onRetry} className={primaryBtn}>
            <RotateCcw className="size-4" />
            {t("lms.retry")}
          </Button>
        ) : certificateCode ? (
          <div className="flex flex-wrap gap-2">
            <Button className={primaryBtn} render={<a href={`/api/certificates/${certificateCode}/pdf`} target="_blank" rel="noreferrer" />}>
              <Download className="size-4" />
              {t("student.downloadCertificate")}
            </Button>
            <Button variant="outline" render={<Link href={`/certificates/${certificateCode}`} />}>
              {t("lms.verifyCertificate")}
            </Button>
          </div>
        ) : includesCertificate ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="flex items-center gap-2 font-medium">
                <ShieldCheck className="size-5 text-[#064E3B] dark:text-emerald-400" />
                {t("lms.certification")}
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <li>
                  {locale === "fr"
                    ? `Certificat officiel délivré par ${CERTIFIER_NAME}, avec QR code de vérification.`
                    : `Official certificate issued by ${CERTIFIER_NAME}, with a verification QR code.`}
                </li>
                <li>
                  {locale === "fr"
                    ? "Payable par Mobile Money dans votre devise locale."
                    : "Payable with Mobile Money in your local currency."}
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground">{t("lms.certificationFee")}</p>
              <p className="font-heading text-3xl font-bold">${CERTIFICATE_PRICE_USD}</p>
              <CheckoutDialog
                kind="certificate"
                targetSlug={slug}
                amountUsd={CERTIFICATE_PRICE_USD}
                onSuccess={onCertified}
                trigger={
                  <Button className={`mt-3 w-full ${primaryBtn}`}>
                    <Award className="size-4" />
                    {t("lms.getCertified")}
                  </Button>
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
