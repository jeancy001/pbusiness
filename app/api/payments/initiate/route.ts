import { randomUUID } from "crypto"
import { z } from "zod"

import { isDbConfigured } from "@/lib/db/mongodb"
import { payments, type PaymentDoc } from "@/lib/db/models"
import { certificates } from "@/lib/db/lms"
import { getSession } from "@/lib/auth/session"
import { getFormationBySlug } from "@/lib/data/catalog"
import { bestAttempt } from "@/lib/lms/queries"
import { AI_COURSE_PRICE_USD, CERTIFICATE_PRICE_USD, CERTIFIER_NAME, EXAM_PASS_SCORE } from "@/lib/lms/catalog"
import { findAiModule, findAiTrack } from "@/lib/lms/ai-tracks"
import { getEvent } from "@/lib/events/data"
import { teacherRevenueShare } from "@/lib/payments/fees"
import { courseEarner } from "@/lib/payments/revenue-owner"
import { SWYCHR_DIGITAL_CHARGE_RATE, convertFromUsd, customerPaysDigitalCharge } from "@/lib/payments/fx"
import { normalizeMobile } from "@/lib/payments/mobile"
import { newCallbackToken } from "@/lib/payments/settle"
import {
  SwychrError,
  createPaymentRequest,
  paymentMethods,
  requiresOrangeOtp,
  swychrConfigured,
  swychrCountries,
} from "@/lib/payments/swychr"

const schema = z.object({
  kind: z.enum(["formation", "subscription", "project", "event", "certificate", "ai_module"]),
  targetSlug: z.string().trim().min(1).max(120).optional(),
  country: z.string().trim().length(2).transform((v) => v.toUpperCase()),
  paymentMethod: z.string().trim().min(1).max(40),
  mobile: z.string().trim().regex(/^\+?[0-9 ]{6,20}$/, "Invalid mobile number"),
  omOtp: z.string().trim().max(12).optional(),
})

const fail = (error: string, status: number) => Response.json({ ok: false, provider: "swychr", error }, { status })

export async function POST(req: Request) {
  try {
    if (!swychrConfigured()) return fail("Payments are not configured. Set ACCOUNTPE_API_TOKEN.", 503)
    if (!isDbConfigured()) return fail("Payments require a configured database.", 503)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
    if (!appUrl?.startsWith("https://")) {
      return fail("NEXT_PUBLIC_APP_URL must be a public https URL so Swychr can confirm payments.", 503)
    }

    const parsed = schema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid payment request.", 400)
    const { kind, country, paymentMethod, omOtp } = parsed.data
    let targetSlug = parsed.data.targetSlug || undefined

    // Payments are always tied to an account so access can be granted.
    const session = await getSession()
    if (!session) return fail("Log in to complete your payment.", 401)

    // ========================================================
    // SERVER-SIDE PRICE
    // ========================================================

    let amountUsd: number
    let label: { fr: string; en: string }
    let teacherId: string | undefined

    if (kind === "formation") {
      const formation = targetSlug ? await getFormationBySlug(targetSlug) : null
      if (!formation) return fail("Course not found.", 404)
      amountUsd = formation.priceUsd
      label = { fr: formation.title.fr, en: formation.title.en }
      // Only teacher-created courses pay a teacher share; admin/AI courses are 100% platform revenue.
      teacherId = courseEarner(formation)
    } else if (kind === "subscription") {
      amountUsd = 15
      label = { fr: "Abonnement étudiant", en: "Student subscription" }
    } else if (kind === "event") {
      // Events are posted by admins; the price always comes from the database.
      const event = targetSlug ? await getEvent(targetSlug) : null
      if (!event?.published) return fail("Event not found.", 404)
      amountUsd = event.priceUsd
      label = { fr: `Billet — ${event.title.fr}`, en: `Ticket — ${event.title.en}` }
    } else if (kind === "certificate") {
      const [formation, attempt, existing] = await Promise.all([
        targetSlug ? getFormationBySlug(targetSlug) : null,
        targetSlug ? bestAttempt(session.userId, targetSlug) : null,
        (await certificates()).findOne({ userId: session.userId, formationSlug: targetSlug }),
      ])
      if (!formation || !attempt?.passed || attempt.score < EXAM_PASS_SCORE) return fail(`Score at least ${EXAM_PASS_SCORE}% on the certification exam first.`, 403)
      if (existing) return fail("Certificate already issued.", 409)
      amountUsd = CERTIFICATE_PRICE_USD
      label = {
        fr: `Certification ${CERTIFIER_NAME} — ${formation.title.fr}`,
        en: `${CERTIFIER_NAME} certification — ${formation.title.en}`,
      }
    } else if (kind === "ai_module") {
      // Linko Academy is sold per course (all modules). A module slug buys its whole course.
      const track = targetSlug ? ((await findAiTrack(targetSlug)) ?? (await findAiModule(targetSlug))?.track) : null
      if (!track) return fail("Course not found.", 404)
      targetSlug = track.slug
      amountUsd = AI_COURSE_PRICE_USD
      label = {
        fr: `Linko Academy — cours ${track.name.fr} (${track.modules.length} modules)`,
        en: `Linko Academy — ${track.name.en} course (${track.modules.length} modules)`,
      }
    } else {
      return fail("Project payments require an approved quote with a valid amount.", 400)
    }

    if (!Number.isFinite(amountUsd) || amountUsd <= 0) return fail("Invalid payment amount.", 400)

    // ========================================================
    // COUNTRY, METHOD AND CURRENCY
    // ========================================================

    if (!swychrCountries().includes(country)) return fail("Payments are not available in this country.", 400)
    const methods = await paymentMethods(country)
    const method = methods?.methods.find((m) => m.method === paymentMethod)
    if (!methods || !method) return fail("This payment method is not available in your country.", 400)
    const mobile = normalizeMobile(country, parsed.data.mobile, method.mobileLength)
    if (!mobile) return fail(`Invalid mobile number. Expected format: ${method.mobileFormat}.`, 400)
    if (requiresOrangeOtp(country, paymentMethod) && !omOtp) {
      return fail("Enter the Orange Money code sent to your phone.", 400)
    }

    const { amount, rate } = await convertFromUsd(amountUsd, methods.currency)
    // What the customer is actually prompted for on their phone.
    const customerTotal = customerPaysDigitalCharge() ? Math.ceil(amount * (1 + SWYCHR_DIGITAL_CHARGE_RATE)) : amount

    // ========================================================
    // CREATE PAYMENT
    // ========================================================

    const reference = randomUUID()
    const { token, hash } = newCallbackToken()
    const callback = (outcome: "success" | "failed") =>
      `${appUrl}/api/payments/swychr/callback?ref=${reference}&token=${token}&outcome=${outcome}`

    const now = new Date()
    const doc: PaymentDoc = {
      reference,
      userId: session.userId,
      provider: "swychr",
      kind,
      targetSlug,
      label,
      amountUsd,
      amount,
      currency: methods.currency,
      country,
      exchangeRate: rate,
      phone: mobile,
      network: paymentMethod,
      teacherId,
      teacherShareUsd: teacherId ? Math.round(amountUsd * teacherRevenueShare() * 100) / 100 : undefined,
      callbackTokenHash: hash,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    }
    // Saved before calling Swychr so an early callback always finds it.
    const col = await payments()
    await col.insertOne(doc)

    try {
      const { providerRef } = await createPaymentRequest({
        transactionId: reference,
        countryCode: country,
        amount,
        name: session.name,
        email: session.email,
        mobile,
        paymentMethod,
        description: label.en,
        omOtp,
        callbackUrl: callback("success"),
        failedCallbackUrl: callback("failed"),
      })
      await col.updateOne({ reference }, { $set: { providerRef, updatedAt: new Date() } })
    } catch (error) {
      await col.updateOne({ reference }, { $set: { status: "failed", updatedAt: new Date() } })
      if (error instanceof SwychrError) return fail(error.message, 400)
      throw error
    }

    return Response.json({
      ok: true,
      provider: "swychr",
      reference,
      status: "pending",
      amountUsd,
      amount,
      customerTotal,
      currency: methods.currency,
      country,
      exchangeRate: rate,
    })
  } catch (error) {
    // Details (bad API key, missing FX rate…) go to the logs, not to customers.
    console.error("Swychr payment route error:", error)
    return fail("Payment service unavailable. Please try again later.", 500)
  }
}
