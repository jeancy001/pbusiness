import { isDbConfigured } from "@/lib/db/mongodb"
import { payouts } from "@/lib/db/lms"
import { syncPayout } from "@/lib/payments/payouts"
import { webhookHashMatches } from "@/lib/payments/swychr"

/**
 * Swychr "Transaction Webhook URL" (merchant portal → Profile).
 * Authenticated by the webhook-hash header. The payload is only used to
 * find the payout; the final status is re-read from the Swychr API.
 */
export async function POST(req: Request) {
  if (!webhookHashMatches(req.headers.get("webhook-hash"))) {
    return Response.json({ ok: false }, { status: 401 })
  }
  const body = (await req.json().catch(() => null)) as {
    event?: string
    data?: { data?: { attributes?: { transaction_id?: string } } }
  } | null

  const transactionId = body?.data?.data?.attributes?.transaction_id?.toUpperCase()
  // Other account events (e.g. pay-in) are settled through their own callbacks.
  if (body?.event !== "payout_status_updated" || !transactionId || !isDbConfigured()) {
    return Response.json({ ok: true, ignored: true })
  }

  const payout = await (await payouts()).findOne({ providerReference: transactionId })
  if (payout) await syncPayout(payout)
  return Response.json({ ok: true })
}
