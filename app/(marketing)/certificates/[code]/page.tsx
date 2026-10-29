import type { Metadata } from "next"
import { BadgeCheck, Download, ShieldX } from "lucide-react"

import { isDbConfigured } from "@/lib/db/mongodb"
import { getCertificate } from "@/lib/lms/certificates"
import { CERTIFIER_NAME, certificateGrade } from "@/lib/lms/catalog"
import { CertificationPartner, LinkoAcademyLogo } from "@/components/brand/linko-academy-logo"

export const metadata: Metadata = { title: "Vérification de certificat" }

// Public page reached from the QR code printed on each certificate.
export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const cert = isDbConfigured() ? await getCertificate(code).catch(() => null) : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      {cert ? (
        <div className="overflow-hidden rounded-3xl border border-[#B8893B]/40 bg-card shadow-sm">
          <div className="flex items-center gap-3 bg-[#064E3B] px-6 py-4 text-white">
            <BadgeCheck className="size-6 text-emerald-300" />
            <div>
              <p className="font-medium">Certificate verified · Certificat authentique</p>
              <p className="text-xs text-emerald-100/80">Linko Academy × {CERTIFIER_NAME}</p>
            </div>
          </div>
          <dl className="grid gap-5 p-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Holder · Titulaire</dt>
              <dd className="mt-1 font-heading text-2xl font-semibold">{cert.studentName}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Course · Cours</dt>
              <dd className="mt-1 font-medium">{cert.formationTitle.en}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Score</dt>
              <dd className="mt-1 font-medium">
                {cert.score}% · {certificateGrade(cert.score).en} / {certificateGrade(cert.score).fr}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Issued · Délivré</dt>
              <dd className="mt-1 font-medium">{cert.issuedAt.toISOString().slice(0, 10)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">ID</dt>
              <dd className="mt-1 font-mono text-sm">{cert.code}</dd>
            </div>
            {cert.teacherName && (
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Instructor</dt>
                <dd className="mt-1 font-medium">{cert.teacherName}</dd>
              </div>
            )}
          </dl>
          <div className="flex flex-wrap items-center gap-5 border-t border-border px-6 py-4">
            <LinkoAcademyLogo />
            <CertificationPartner />
          </div>
          <div className="border-t border-border px-6 py-4">
            <a
              href={`/api/certificates/${cert.code}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#064E3B] hover:underline dark:text-emerald-400"
            >
              <Download className="size-4" />
              PDF
            </a>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <ShieldX className="mx-auto size-10 text-destructive" />
          <p className="mt-4 font-heading text-xl font-semibold">Certificate not found · Certificat introuvable</p>
          <p className="mt-2 font-mono text-sm text-muted-foreground">{code}</p>
        </div>
      )}
    </div>
  )
}
