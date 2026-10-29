import { isDbConfigured } from "@/lib/db/mongodb"
import { payments } from "@/lib/db/models"
import { settlePayment, tokenMatches } from "@/lib/payments/settle"

/**
 * Swychr payment_link_status_updated callback.
 *
 * Swychr POSTs here using the per-payment callback_url (success) or
 * failed_callback_url (failed/expired) we sent when creating the
 * payment. The secret token in the URL authenticates the call, and the
 * URL itself carries the outcome, so the body is only stored for audit.
 */
export async function POST(req: Request) {
  const url = new URL(req.url)
  const reference = url.searchParams.get("ref") ?? ""
  const token = url.searchParams.get("token") ?? ""
  const outcome = url.searchParams.get("outcome")
  const body = await req.json().catch(() => null)

  // Account-level webhooks arrive without our token: acknowledge, ignore.
  if (!reference || !token || (outcome !== "success" && outcome !== "failed") || !isDbConfigured()) {
    return Response.json({ ok: true, ignored: true })
  }

  const payment = await (await payments()).findOne({ reference })
  if (!payment || !tokenMatches(token, payment.callbackTokenHash)) {
    console.warn("Rejected Swychr callback", { reference })
    return Response.json({ ok: false }, { status: 401 })
  }

  await settlePayment(reference, outcome, { callbackPayload: body })
  return Response.json({ ok: true })
}
