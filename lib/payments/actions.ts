"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { payouts, toObjectId } from "@/lib/db/lms"
import { sessionWithRole } from "@/lib/lms/queries"
import { MIN_PAYOUT_USD, payoutFee } from "@/lib/payments/fees"
import { normalizeMobile } from "@/lib/payments/mobile"
import { notifyPayoutRequested, notifyPayoutStatus } from "@/lib/email/notify"
import { platformRevenue, sendPayout, syncPayout, teacherBalance } from "@/lib/payments/payouts"
import { settlePayment } from "@/lib/payments/settle"
import { isMobilePayoutMethod, paymentMethods, swychrCountries } from "@/lib/payments/swychr"

type Result = { ok: true } | { ok: false; error: string }
const fail = (error: string): Result => ({ ok: false, error })

function refresh() {
  revalidatePath("/dashboard/teacher/payouts")
  revalidatePath("/dashboard/admin/payments")
}

// ============================================================
// TEACHER
// ============================================================

const requestSchema = z.object({
  amountUsd: z.coerce.number().min(MIN_PAYOUT_USD, `Minimum payout is $${MIN_PAYOUT_USD}`),
  country: z.string().trim().length(2).transform((v) => v.toUpperCase()),
  method: z.string().trim().min(1).max(40),
  mobile: z.string().trim().regex(/^\+?[0-9 ]{6,20}$/, "Invalid mobile number"),
})

export async function requestPayoutAction(input: unknown): Promise<Result> {
  const teacher = await sessionWithRole("teacher")
  if (!teacher) return fail("Forbidden")
  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid request")

  const { country, method } = parsed.data
  const amountUsd = Math.round(parsed.data.amountUsd * 100) / 100

  if (!swychrCountries().includes(country)) return fail("Payouts are not available in this country.")
  const methods = await paymentMethods(country)
  const chosen = methods?.methods.find((m) => m.method === method && isMobilePayoutMethod(m.method))
  if (!chosen) return fail("This payout method is not available in your country.")
  const mobile = normalizeMobile(country, parsed.data.mobile, chosen.mobileLength)
  if (!mobile) return fail(`Invalid mobile number. Expected format: ${chosen.mobileFormat}.`)

  const balance = await teacherBalance(teacher.userId)
  if (amountUsd > balance.availableUsd) return fail(`Available balance is $${balance.availableUsd.toFixed(2)}.`)

  const { rate, feeUsd, netUsd } = payoutFee(amountUsd)
  const now = new Date()
  const col = await payouts()
  const { insertedId } = await col.insertOne({
    teacherId: teacher.userId,
    teacherName: teacher.name,
    amountUsd,
    feeRate: rate,
    feeUsd,
    netUsd,
    country,
    method,
    mobile,
    status: "requested",
    createdAt: now,
    updatedAt: now,
  })

  // Two concurrent requests can both pass the check above; undo ours if we overdrew.
  if ((await teacherBalance(teacher.userId)).availableUsd < 0) {
    await col.deleteOne({ _id: insertedId })
    return fail("Insufficient balance. Please refresh and try again.")
  }
  notifyPayoutRequested({ teacherName: teacher.name, amountUsd, netUsd, method, country })
  refresh()
  return { ok: true }
}

export async function cancelPayoutAction(id: string): Promise<Result> {
  const teacher = await sessionWithRole("teacher")
  const _id = toObjectId(id)
  if (!teacher || !_id) return fail("Forbidden")
  const res = await (await payouts()).updateOne(
    { _id, teacherId: teacher.userId, status: "requested" },
    { $set: { status: "rejected", note: "Cancelled by teacher", updatedAt: new Date() } },
  )
  if (!res.modifiedCount) return fail("This payout can no longer be cancelled.")
  refresh()
  return { ok: true }
}

// ============================================================
// ADMIN
// ============================================================

/** Admin sends a payout through Swychr, or rejects it (funds return to the teacher). */
export async function reviewPayoutAction(input: { id: string; decision: "send" | "reject" | "sync"; note?: string }): Promise<Result> {
  const admin = await sessionWithRole("admin")
  const _id = toObjectId(input.id)
  if (!admin || !_id) return fail("Forbidden")

  if (input.decision === "send") {
    const res = await sendPayout(_id, admin.userId)
    refresh()
    return res
  }

  if (input.decision === "sync") {
    const doc = await (await payouts()).findOne({ _id })
    if (!doc) return fail("Payout not found.")
    await syncPayout(doc)
    refresh()
    return { ok: true }
  }

  const res = await (await payouts()).findOneAndUpdate(
    { _id, status: { $in: ["requested", "approved"] } },
    {
      $set: {
        status: "rejected",
        reviewedBy: admin.userId,
        updatedAt: new Date(),
        ...(input.note ? { note: input.note.trim().slice(0, 300) } : {}),
      },
    },
    { returnDocument: "after" },
  )
  if (!res) return fail("This payout has already been processed.")
  notifyPayoutStatus(res)
  refresh()
  return { ok: true }
}

/**
 * Admin withdraws platform revenue to their own Mobile Money via Swychr.
 * No payout fee: it's the platform's own money.
 */
export async function withdrawPlatformRevenueAction(input: unknown): Promise<Result> {
  const admin = await sessionWithRole("admin")
  if (!admin) return fail("Forbidden")
  const parsed = requestSchema.extend({ amountUsd: z.coerce.number().min(1, "Minimum withdrawal is $1") }).safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid request")

  const { country, method } = parsed.data
  const amountUsd = Math.round(parsed.data.amountUsd * 100) / 100
  const methods = await paymentMethods(country)
  const chosen = methods?.methods.find((m) => m.method === method && isMobilePayoutMethod(m.method))
  if (!swychrCountries().includes(country) || !chosen) return fail("This payout method is not available in this country.")
  const mobile = normalizeMobile(country, parsed.data.mobile, chosen.mobileLength)
  if (!mobile) return fail(`Invalid mobile number. Expected format: ${chosen.mobileFormat}.`)

  const revenue = await platformRevenue()
  if (amountUsd > revenue.availableUsd) return fail(`Available platform revenue is $${revenue.availableUsd.toFixed(2)}.`)

  const now = new Date()
  const col = await payouts()
  const { insertedId } = await col.insertOne({
    kind: "platform",
    teacherId: admin.userId,
    teacherName: admin.name,
    amountUsd,
    feeRate: 0,
    feeUsd: 0,
    netUsd: amountUsd,
    country,
    method,
    mobile,
    status: "approved",
    createdAt: now,
    updatedAt: now,
  })
  if ((await platformRevenue()).availableUsd < 0) {
    await col.deleteOne({ _id: insertedId })
    return fail("Insufficient platform revenue. Please refresh and try again.")
  }
  const res = await sendPayout(insertedId, admin.userId)
  refresh()
  return res
}

/**
 * Manual reconciliation for a payment Swychr shows as settled but whose
 * callback never arrived. Check the Swychr Transactions dashboard first.
 */
export async function resolvePaymentAction(input: { reference: string; outcome: "success" | "failed" }): Promise<Result> {
  const admin = await sessionWithRole("admin")
  if (!admin) return fail("Forbidden")
  const updated = await settlePayment(input.reference, input.outcome, { confirmedBy: admin.userId })
  if (!updated) return fail("This payment is no longer pending.")
  refresh()
  revalidatePath("/dashboard/admin")
  return { ok: true }
}
