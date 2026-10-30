import "server-only"
import { createHash, randomBytes, timingSafeEqual } from "crypto"

import { enrollments, payments, type PaymentDoc } from "@/lib/db/models"
import { grantAiTrack, issueCertificate } from "@/lib/lms/certificates"
import { findAiTrack } from "@/lib/lms/ai-tracks"
import { getEvent, issueEventTicket } from "@/lib/events/data"
import { notifyAiModuleUnlocked, notifyCertificate, notifyPayment } from "@/lib/email/notify"
import { extendBadge } from "@/lib/teachers/badge"

// ============================================================
// CALLBACK TOKENS
//
// Each payment gets its own secret, embedded only in the callback
// URLs we hand to Swychr server-to-server. Possession of the token
// authenticates the callback, independent of the webhook signature.
// ============================================================

export function newCallbackToken() {
  const token = randomBytes(32).toString("base64url")
  return { token, hash: hashToken(token) }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function tokenMatches(token: string, expectedHash?: string) {
  if (!expectedHash) return false
  const a = Buffer.from(hashToken(token), "hex")
  const b = Buffer.from(expectedHash, "hex")
  return a.length === b.length && timingSafeEqual(a, b)
}

// ============================================================
// SETTLEMENT
// ============================================================

/**
 * Moves a pending payment to its final state exactly once, then grants
 * what was bought. Returns the updated payment, or null if it was
 * already final (repeat callbacks are harmless).
 */
export async function settlePayment(
  reference: string,
  outcome: "success" | "failed",
  meta: { callbackPayload?: unknown; confirmedBy?: string } = {},
): Promise<PaymentDoc | null> {
  const col = await payments()
  const payment = await col.findOneAndUpdate(
    { reference, status: "pending" },
    { $set: { status: outcome, updatedAt: new Date(), ...meta } },
    { returnDocument: "after" },
  )
  if (!payment) return null
  notifyPayment(payment)
  if (outcome === "success") await fulfil(payment)
  return payment
}

async function fulfil(payment: PaymentDoc) {
  const { userId, targetSlug, kind, reference } = payment
  if (!userId || !targetSlug) return

  if (kind === "formation") {
    await (await enrollments()).updateOne(
      { userId, formationSlug: targetSlug },
      {
        $setOnInsert: { userId, formationSlug: targetSlug, progress: 0, status: "active", createdAt: new Date() },
        $set: { paymentId: reference },
      },
      { upsert: true },
    )
  } else if (kind === "certificate") {
    const { cert, created } = await issueCertificate(userId, targetSlug, reference)
    if (cert && created) notifyCertificate(cert)
  } else if (kind === "event") {
    const event = await getEvent(targetSlug)
    if (event) await issueEventTicket(userId, event, payment)
  } else if (kind === "ai_module") {
    await grantAiTrack(userId, targetSlug, reference)
    const track = await findAiTrack(targetSlug)
    if (track) notifyAiModuleUnlocked(userId, `${track.name.en} (${track.modules.length} modules)`, `${track.slug}-1`)
  } else if (kind === "teacher_badge") {
    await extendBadge(userId)
  }
}
