import { isDbConfigured } from "@/lib/db/mongodb"
import { payments, enrollments } from "@/lib/db/models"
import { checkPayment } from "@/lib/payments/providers"
import type { PaymentProvider } from "@/lib/db/models"

export async function GET(req: Request) {
  const reference = new URL(req.url).searchParams.get("reference")
  if (!reference) {
    return Response.json({ ok: false, error: "Missing reference." }, { status: 400 })
  }

  // No DB: simulated flow resolves to success so the UX completes.
  if (!isDbConfigured()) {
    return Response.json({ ok: true, status: "success", simulated: true })
  }

  const col = await payments()
  const payment = await col.findOne({ reference })
  if (!payment) {
    return Response.json({ ok: false, error: "Payment not found." }, { status: 404 })
  }

  // Already finalized — return the stored status.
  if (payment.status !== "pending") {
    return Response.json({ ok: true, status: payment.status })
  }

  const result = await checkPayment(payment.provider as PaymentProvider, reference)
  await col.updateOne(
    { reference },
    { $set: { status: result.status, providerRef: result.providerRef, updatedAt: new Date() } },
  )

  // On success, unlock the purchased item (formation enrollment).
  if (result.status === "success" && payment.kind === "formation" && payment.targetSlug && payment.userId) {
    const enr = await enrollments()
    await enr.updateOne(
      { userId: payment.userId, formationSlug: payment.targetSlug },
      {
        $setOnInsert: {
          userId: payment.userId,
          formationSlug: payment.targetSlug,
          progress: 0,
          status: "active",
          createdAt: new Date(),
        },
        $set: { paymentId: reference },
      },
      { upsert: true },
    )
  }

  return Response.json({ ok: true, status: result.status })
}
