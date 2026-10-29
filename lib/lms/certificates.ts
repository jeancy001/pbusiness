import "server-only"
import { randomBytes } from "crypto"

import { users } from "@/lib/db/models"
import { aiModuleAccess, byUserId, certificates, type CertificateDoc } from "@/lib/db/lms"
import { getFormationBySlug } from "@/lib/data/catalog"
import { bestAttempt } from "@/lib/lms/queries"
import { CERTIFIER_NAME, EXAM_PASS_SCORE, aiCertKey, aiModuleSlug, type AiTrack } from "@/lib/lms/catalog"
import { findAiTrack } from "@/lib/lms/ai-tracks"

/**
 * Issued once per (student, course) after the exam is passed AND the
 * certification fee is confirmed by the payment provider. Idempotent.
 */
export async function issueCertificate(userId: string, slug: string, paymentReference: string) {
  const col = await certificates()
  const existing = await col.findOne({ userId, formationSlug: slug })
  if (existing) return { cert: existing, created: false }

  const [attempt, formation, user] = await Promise.all([
    bestAttempt(userId, slug),
    getFormationBySlug(slug),
    (await users()).findOne(byUserId(userId)),
  ])
  // Older attempts may have passed under a lower teacher-set mark; 70% is the floor.
  if (!attempt?.passed || attempt.score < EXAM_PASS_SCORE || !formation || !user) return { cert: null, created: false }

  const doc: CertificateDoc = {
    code: `LP-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`,
    userId,
    studentName: user.name,
    formationSlug: slug,
    formationTitle: formation.title,
    teacherName: formation.teacherName,
    score: attempt.score,
    paymentReference,
    issuedAt: new Date(),
  }
  await col.insertOne(doc)
  return { cert: doc, created: true }
}

/** One purchase unlocks every module of the AI course. */
export async function grantAiTrack(userId: string, trackSlug: string, paymentReference: string) {
  const track = await findAiTrack(trackSlug)
  if (!track) return
  for (let i = 1; i <= track.modules.length; i++) await grantAiModule(userId, aiModuleSlug(trackSlug, i), paymentReference)
}

/**
 * AI courses are certified once every module is finished and the final
 * exam is passed — the course purchase already covers the certificate.
 */
export async function issueAiCertificate(userId: string, track: AiTrack, score: number, paymentReference: string) {
  const col = await certificates()
  const key = aiCertKey(track.slug)
  const existing = await col.findOne({ userId, formationSlug: key })
  if (existing) return { cert: existing, created: false }

  const user = await (await users()).findOne(byUserId(userId))
  if (!user || score < EXAM_PASS_SCORE) return { cert: null, created: false }

  const doc: CertificateDoc = {
    code: `LP-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`,
    userId,
    studentName: user.name,
    formationSlug: key,
    formationTitle: { ...track.name, fr: `Linko Academy — ${track.name.fr}`, en: `Linko Academy — ${track.name.en}` },
    teacherName: "Linko Academy Faculty",
    score,
    paymentReference,
    issuedAt: new Date(),
  }
  await col.insertOne(doc)
  return { cert: doc, created: true }
}

export async function grantAiModule(userId: string, moduleSlug: string, paymentReference: string) {
  await (await aiModuleAccess()).updateOne(
    { userId, moduleSlug },
    { $setOnInsert: { userId, moduleSlug, paymentReference, createdAt: new Date() } },
    { upsert: true },
  )
}

export async function getCertificate(code: string) {
  return (await certificates()).findOne({ code })
}
