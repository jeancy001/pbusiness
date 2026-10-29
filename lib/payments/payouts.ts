import "server-only"

import { isDbConfigured } from "@/lib/db/mongodb"
import { payments, users } from "@/lib/db/models"
import { payouts, type PayoutDoc } from "@/lib/db/lms"
import { convertFromUsd } from "@/lib/payments/fx"
import { notifyPayoutStatus } from "@/lib/email/notify"
import { SwychrError, createPayout, paymentMethods, payoutStatus, walletBalances } from "@/lib/payments/swychr"
import type { LocalizedText } from "@/lib/mock-data"

// A teacher's balance is derived, never stored:
//   earned    = their share of successful course sales
//   reserved  = payouts requested, approved or being sent
//   available = earned - reserved - paid

export type Balance = { earnedUsd: number; reservedUsd: number; paidUsd: number; availableUsd: number }

export type PayoutView = Omit<PayoutDoc, "_id" | "createdAt" | "updatedAt" | "sentAt"> & {
  id: string
  createdAt: string
  updatedAt: string
  sentAt?: string
}

export type SaleView = {
  reference: string
  label: LocalizedText
  amountUsd: number
  teacherShareUsd: number
  date: string
}

const cents = (n: number) => Math.round(n * 100) / 100

function payoutView(doc: PayoutDoc): PayoutView {
  const { _id, createdAt, updatedAt, sentAt, ...rest } = doc
  return {
    ...rest,
    id: String(_id),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    sentAt: sentAt?.toISOString(),
  }
}

// ============================================================
// SENDING & SYNC (Swychr Payout API)
// ============================================================

const FINAL_OK = ["SUCCESS"]
const FINAL_KO = ["FAILED", "REFUNDED"]

/**
 * Sends a requested/approved payout through Swychr. The payout is moved to
 * "processing" first (atomically, so it can never be sent twice); a business
 * rejection from Swychr puts it back to "approved" with the reason.
 */
export async function sendPayout(id: PayoutDoc["_id"], adminId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const col = await payouts()
  const payout = await col.findOneAndUpdate(
    { _id: id, status: { $in: ["requested", "approved"] } },
    { $set: { status: "processing", reviewedBy: adminId, updatedAt: new Date() } },
    { returnDocument: "after" },
  )
  if (!payout) return { ok: false, error: "This payout has already been processed." }

  // One fixed id per payout: retrying after a timeout can never pay twice.
  const transactionId = `PO-${String(payout._id)}`.toUpperCase()
  // Errors before the Swychr call can't have moved money, so they're safe to undo.
  let reachedSwychr = false
  try {
    const methods = await paymentMethods(payout.country)
    if (!methods) throw new SwychrError("Payouts are not enabled for this country on the Swychr account.")
    const { amount, rate } = await convertFromUsd(payout.netUsd, methods.currency)
    await col.updateOne(
      { _id: payout._id },
      { $set: { providerReference: transactionId, amountLocal: amount, currency: methods.currency, fxRate: rate } },
    )
    reachedSwychr = true
    const res = await createPayout({
      transactionId,
      countryCode: payout.country,
      beneficiaryName: payout.teacherName,
      mobile: payout.mobile,
      amount,
      paymentMethod: payout.method,
      remarks: "P Business Online teacher payout",
    })
    await col.updateOne({ _id: payout._id }, { $set: { providerStatus: res.status, sentAt: new Date(), updatedAt: new Date() } })
    return { ok: true }
  } catch (error) {
    if (error instanceof SwychrError || !reachedSwychr) {
      // Rejected up front (e.g. insufficient wallet balance) or failed before the call: nothing was debited.
      const reason = String((error as Error)?.message ?? error).slice(0, 300)
      await col.updateOne(
        { _id: payout._id },
        { $set: { status: "approved", note: reason, updatedAt: new Date() }, $unset: { providerStatus: "" } },
      )
      return { ok: false, error: reason }
    }
    // Network/unknown failure: the payout may exist at Swychr. Stay "processing";
    // status sync resolves it using the same transaction_id.
    console.error(`Swychr payout send error: ${String((error as Error)?.message ?? error)}`)
    return { ok: false, error: "Could not confirm the payout with Swychr. Its status will be checked automatically." }
  }
}

/** Asks Swychr for the payout's status and applies a final result. */
export async function syncPayout(doc: PayoutDoc): Promise<PayoutDoc["status"]> {
  if (doc.status !== "processing" || !doc.providerReference) return doc.status
  const status = await payoutStatus(doc.providerReference)
  const col = await payouts()

  if (status === null) {
    // Never reached Swychr (e.g. crash before the call): safe to send again.
    if (!doc.sentAt && Date.now() - doc.updatedAt.getTime() > 5 * 60_000) {
      await col.updateOne({ _id: doc._id, status: "processing" }, { $set: { status: "approved", updatedAt: new Date() } })
      return "approved"
    }
    return doc.status
  }

  const next = FINAL_OK.includes(status) ? "paid" : FINAL_KO.includes(status) ? "failed" : "processing"
  const updated = await col.findOneAndUpdate(
    { _id: doc._id, status: "processing" },
    {
      $set: {
        status: next,
        providerStatus: status,
        updatedAt: new Date(),
        ...(next === "failed" ? { note: `Swychr: ${status}. Amount returned to the teacher's balance.` } : {}),
      },
    },
    { returnDocument: "after" },
  )
  // Only the request that moved it to a final state sends the email.
  if (updated && next !== "processing") notifyPayoutStatus(updated)
  return next
}

/** Payouts still in flight for more than a minute (webhooks are sent once, without retries). */
export async function syncStalePayouts() {
  const stale = await (await payouts())
    .find({ status: "processing", updatedAt: { $lte: new Date(Date.now() - 60_000) } })
    .limit(20)
    .toArray()
  await Promise.all(stale.map((p) => syncPayout(p).catch(() => undefined)))
}

export async function teacherBalance(teacherId: string): Promise<Balance> {
  const [earned, out] = await Promise.all([
    (await payments())
      .aggregate<{ total: number }>([
        { $match: { teacherId, status: "success" } },
        { $group: { _id: null, total: { $sum: "$teacherShareUsd" } } },
      ])
      .toArray(),
    (await payouts())
      .aggregate<{ _id: string; total: number }>([
        { $match: { teacherId, kind: { $ne: "platform" }, status: { $in: ["requested", "approved", "processing", "paid"] } } },
        { $group: { _id: "$status", total: { $sum: "$amountUsd" } } },
      ])
      .toArray(),
  ])
  const earnedUsd = cents(earned[0]?.total ?? 0)
  const paidUsd = cents(out.find((o) => o._id === "paid")?.total ?? 0)
  const reservedUsd = cents(out.filter((o) => o._id !== "paid").reduce((sum, o) => sum + o.total, 0))
  return { earnedUsd, reservedUsd, paidUsd, availableUsd: cents(earnedUsd - reservedUsd - paidUsd) }
}

export async function getTeacherPayouts(teacherId: string) {
  if (!isDbConfigured()) {
    return { balance: { earnedUsd: 0, reservedUsd: 0, paidUsd: 0, availableUsd: 0 }, payouts: [], sales: [] }
  }
  await syncStalePayouts().catch(() => undefined)
  const [balance, history, sales] = await Promise.all([
    teacherBalance(teacherId),
    (await payouts()).find({ teacherId, kind: { $ne: "platform" } }).sort({ createdAt: -1 }).limit(50).toArray(),
    (await payments()).find({ teacherId, status: "success" }).sort({ createdAt: -1 }).limit(20).toArray(),
  ])
  return {
    balance,
    payouts: history.map(payoutView),
    sales: sales.map(
      (p): SaleView => ({
        reference: p.reference,
        label: p.label,
        amountUsd: p.amountUsd,
        teacherShareUsd: p.teacherShareUsd ?? 0,
        date: p.createdAt.toISOString(),
      }),
    ),
  }
}

// ============================================================
// PLATFORM REVENUE
//
//   course revenue = course sales − teacher shares (10% of teachers' own
//                    courses, 100% of admin/AI-created courses)
//   other sales  = certificates, AI modules, events, subscriptions (100%)
//   payout fees  = fees deducted from paid teacher payouts
//   available    = all of the above − admin withdrawals (not failed/rejected)
// ============================================================

export type PlatformRevenue = {
  grossSalesUsd: number
  teacherEarningsUsd: number
  courseCommissionUsd: number
  otherSalesUsd: number
  payoutFeesUsd: number
  withdrawnUsd: number
  availableUsd: number
  byKind: { kind: string; grossUsd: number; platformUsd: number; count: number }[]
}

export async function platformRevenue(): Promise<PlatformRevenue> {
  const empty = { grossSalesUsd: 0, teacherEarningsUsd: 0, courseCommissionUsd: 0, otherSalesUsd: 0, payoutFeesUsd: 0, withdrawnUsd: 0, availableUsd: 0, byKind: [] }
  if (!isDbConfigured()) return empty

  const [sales, fees, withdrawals] = await Promise.all([
    (await payments())
      .aggregate<{ _id: string; gross: number; teacher: number; count: number }>([
        { $match: { status: "success" } },
        { $group: { _id: "$kind", gross: { $sum: "$amountUsd" }, teacher: { $sum: { $ifNull: ["$teacherShareUsd", 0] } }, count: { $sum: 1 } } },
      ])
      .toArray(),
    (await payouts())
      .aggregate<{ total: number }>([
        { $match: { kind: { $ne: "platform" }, status: "paid" } },
        { $group: { _id: null, total: { $sum: "$feeUsd" } } },
      ])
      .toArray(),
    (await payouts())
      .aggregate<{ total: number }>([
        { $match: { kind: "platform", status: { $in: ["requested", "approved", "processing", "paid"] } } },
        { $group: { _id: null, total: { $sum: "$amountUsd" } } },
      ])
      .toArray(),
  ])

  const byKind = sales.map((s) => ({ kind: s._id, grossUsd: cents(s.gross), platformUsd: cents(s.gross - s.teacher), count: s.count }))
  const grossSalesUsd = cents(sales.reduce((sum, s) => sum + s.gross, 0))
  const teacherEarningsUsd = cents(sales.reduce((sum, s) => sum + s.teacher, 0))
  const course = byKind.find((k) => k.kind === "formation")
  const courseCommissionUsd = course?.platformUsd ?? 0
  const otherSalesUsd = cents(byKind.filter((k) => k.kind !== "formation").reduce((sum, k) => sum + k.platformUsd, 0))
  const payoutFeesUsd = cents(fees[0]?.total ?? 0)
  const withdrawnUsd = cents(withdrawals[0]?.total ?? 0)
  return {
    grossSalesUsd,
    teacherEarningsUsd,
    courseCommissionUsd,
    otherSalesUsd,
    payoutFeesUsd,
    withdrawnUsd,
    availableUsd: cents(courseCommissionUsd + otherSalesUsd + payoutFeesUsd - withdrawnUsd),
    byKind,
  }
}

export type PendingPaymentView = {
  reference: string
  label: LocalizedText
  amountUsd: number
  amount: number
  currency: string
  method?: string
  phone?: string
  customer?: string
  date: string
}

export async function getAdminPayments() {
  if (!isDbConfigured()) return { payouts: [], pendingPayments: [], teachers: [], wallets: [], revenue: await platformRevenue() }

  await syncStalePayouts().catch(() => undefined)

  const [allPayouts, pending, teacherDocs, wallets] = await Promise.all([
    (await payouts()).find({}).sort({ createdAt: -1 }).limit(100).toArray(),
    // Older than 2 minutes: the callback has had a fair chance to arrive.
    (await payments())
      .find({ status: "pending", createdAt: { $lte: new Date(Date.now() - 2 * 60_000) } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray(),
    (await users()).find({ role: "teacher" }, { projection: { name: 1, email: 1 } }).toArray(),
    walletBalances().catch(() => []),
  ])

  const customerIds = [...new Set(pending.map((p) => p.userId).filter(Boolean))] as string[]
  const { ObjectId } = await import("mongodb")
  const customers = customerIds.length
    ? await (await users())
        .find({ _id: { $in: customerIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id)) } } as never, {
          projection: { name: 1, email: 1 },
        })
        .toArray()
    : []

  const teachers = await Promise.all(
    teacherDocs.map(async (t) => ({ id: String(t._id), name: t.name, email: t.email, ...(await teacherBalance(String(t._id))) })),
  )

  return {
    payouts: allPayouts.map(payoutView),
    pendingPayments: pending.map(
      (p): PendingPaymentView => ({
        reference: p.reference,
        label: p.label,
        amountUsd: p.amountUsd,
        amount: p.amount,
        currency: p.currency,
        method: p.network,
        phone: p.phone,
        customer: customers.find((c) => String(c._id) === p.userId)?.email,
        date: p.createdAt.toISOString(),
      }),
    ),
    teachers,
    wallets,
    revenue: await platformRevenue(),
  }
}
