import { isDbConfigured } from "@/lib/db/mongodb"
import {
payments,
enrollments,
} from "@/lib/db/models"

import {
checkPayment,
pawapayConfigured,
} from "@/lib/payments/providers"

// ============================================================
// PAYMENT STATUS ROUTE
// ============================================================

export async function GET(
req: Request,
) {
try {
// ==========================================================
// GET PAYMENT REFERENCE
// ==========================================================


const reference =
  new URL(
    req.url,
  ).searchParams.get("reference")

if (!reference?.trim()) {
  return Response.json(
    {
      ok: false,
      error:
        "Missing payment reference.",
    },
    {
      status: 400,
    },
  )
}

// ==========================================================
// DATABASE CONFIGURATION
//
// Real PawaPay payments require persistent
// payment storage. Never automatically mark
// a real payment as successful.
// ==========================================================

if (!isDbConfigured()) {
  return Response.json(
    {
      ok: false,
      status: "failed",

      error:
        "Payment status tracking requires a configured database.",
    },
    {
      status: 503,
    },
  )
}

// ==========================================================
// GET PAYMENT
// ==========================================================

const collection =
  await payments()

const payment =
  await collection.findOne({
    reference,
  })

if (!payment) {
  return Response.json(
    {
      ok: false,
      error:
        "Payment not found.",
    },
    {
      status: 404,
    },
  )
}

// ==========================================================
// RETURN FINALIZED PAYMENT
//
// No need to call PawaPay again when the
// payment has already reached a final state.
// ==========================================================

if (
  payment.status === "success" ||
  payment.status === "failed"
) {
  return Response.json({
    ok: true,

    status:
      payment.status,

    reference,

    provider:
      payment.provider,

    providerRef:
      payment.providerRef,

    amount:
      payment.amount,

    amountUsd:
      payment.amountUsd,

    currency:
      payment.currency,

    country:
      payment.country,
  })
}

// ==========================================================
// PROVIDER VALIDATION
// ==========================================================

if (
  payment.provider === "pawapay" &&
  !pawapayConfigured()
) {
  return Response.json(
    {
      ok: false,
      status: "pending",

      error:
        "PawaPay is not configured on the server.",
    },
    {
      status: 503,
    },
  )
}

// ==========================================================
// CHECK PAYMENT WITH PROVIDER
//
// The current provider implementation uses:
//
// checkPayment(reference)
// ==========================================================

const result =
  await checkPayment(
    reference,
  )

// ==========================================================
// UPDATE PAYMENT RECORD
// ==========================================================

await collection.updateOne(
  {
    reference,
  },
  {
    $set: {
      status:
        result.status,

      providerRef:
        result.providerRef ??
        payment.providerRef,

      updatedAt:
        new Date(),
    },
  },
)

// ==========================================================
// UNLOCK FORMATION
//
// Only after the provider confirms that the
// payment was successful.
// ==========================================================

if (
  result.status === "success" &&
  payment.kind === "formation" &&
  payment.targetSlug &&
  payment.userId
) {
  try {
    const enrollmentCollection =
      await enrollments()

    await enrollmentCollection.updateOne(
      {
        userId:
          payment.userId,

        formationSlug:
          payment.targetSlug,
      },
      {
        $setOnInsert: {
          userId:
            payment.userId,

          formationSlug:
            payment.targetSlug,

          progress: 0,

          status: "active",

          createdAt:
            new Date(),
        },

        $set: {
          paymentId:
            reference,
        },
      },
      {
        upsert: true,
      },
    )
  } catch (error) {
    console.error(
      "Unable to unlock formation:",
      error,
    )

    // The payment itself remains successful.
    // Enrollment can be retried safely later.
  }
}

// ==========================================================
// RESPONSE
// ==========================================================

return Response.json({
  ok:
    result.ok,

  reference,

  provider:
    payment.provider,

  status:
    result.status,

  providerRef:
    result.providerRef ??
    payment.providerRef,

  amount:
    payment.amount,

  amountUsd:
    payment.amountUsd,

  currency:
    payment.currency,

  country:
    payment.country,

  error:
    result.error,
})


} catch (error) {
console.error(
"Payment status route error:",
error,
)


return Response.json(
  {
    ok: false,

    status:
      "failed",

    error:
      error instanceof Error
        ? error.message
        : "Unable to check payment status.",
  },
  {
    status: 500,
  },
)


}
}
