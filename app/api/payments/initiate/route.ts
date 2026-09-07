import { randomUUID } from "crypto"
import { z } from "zod"

import { isDbConfigured } from "@/lib/db/mongodb"
import {
payments,
type PaymentKind,
} from "@/lib/db/models"

import { getSession } from "@/lib/auth/session"
import { getFormationBySlug } from "@/lib/data/catalog"

import {
initiatePayment,
pawapayConfigured,
} from "@/lib/payments/providers"

// ============================================================
// EVENT CONFIGURATION
// ============================================================
//
// The server is the ONLY trusted source for
// event names and prices.
//
// Never accept event prices from the client.
// ============================================================

const EVENTS = {
"unikin-programming-event-2026": {
priceUsd: 15,


label: {
  fr: "Billet — Événement de Programmation des Étudiants de l'UNIKIN",
  en: "Ticket — UNIKIN Students Programming Event",
},


},
} as const

// ============================================================
// REQUEST VALIDATION
// ============================================================

const schema = z.object({
/**

* These values must match the frontend
* CheckoutDialog and the database PaymentKind.
  */
  kind: z.enum([
  "formation",
  "subscription",
  "project",
  "event",
  ]),

/**

* Required for formation and event payments.
  */
  targetSlug: z
  .string()
  .trim()
  .min(1)
  .max(120)
  .optional(),

phone: z
.string()
.trim()
.min(6)
.max(30),

network: z
.string()
.trim()
.min(1)
.max(80)
.optional(),

country: z
.string()
.trim()
.length(2)
.transform((value) =>
value.toUpperCase(),
),
})

// ============================================================
// PAYMENT ROUTE
// ============================================================

export async function POST(
req: Request,
) {
try {
// ========================================================
// PAWAPAY CONFIGURATION
// ========================================================


if (!pawapayConfigured()) {
  return Response.json(
    {
      ok: false,
      provider: "pawapay",

      error:
        "PawaPay is not configured. Please configure PAWAPAY_API_TOKEN.",
    },
    {
      status: 503,
    },
  )
}

// ========================================================
// PARSE REQUEST BODY
// ========================================================

let body: unknown

try {
  body = await req.json()
} catch {
  return Response.json(
    {
      ok: false,
      provider: "pawapay",

      error:
        "Invalid JSON request body.",
    },
    {
      status: 400,
    },
  )
}

// ========================================================
// VALIDATE REQUEST
// ========================================================

const parsed =
  schema.safeParse(body)

if (!parsed.success) {
  console.error(
    "Invalid payment request:",
    parsed.error.flatten(),
  )

  return Response.json(
    {
      ok: false,
      provider: "pawapay",

      error:
        "Invalid payment request.",

      details:
        parsed.error.flatten(),
    },
    {
      status: 400,
    },
  )
}

const {
  kind,
  phone,
  network,
  country,
} = parsed.data

// ========================================================
// NORMALIZE TARGET SLUG
// ========================================================

const targetSlug =
  parsed.data.targetSlug?.trim() ||
  undefined

// ========================================================
// VALIDATE DATABASE PAYMENT KIND
//
// This is intentionally explicit so that
// TypeScript catches future inconsistencies.
// ========================================================

const paymentKind: PaymentKind =
  kind

// ========================================================
// USER SESSION
// ========================================================

const session =
  await getSession()

// ========================================================
// SERVER-SIDE PRICE CALCULATION
//
// SECURITY:
//
// The client NEVER sends a trusted amount.
//
// The price is determined exclusively here
// using kind + targetSlug.
// ========================================================

let amountUsd = 0

let label = {
  fr: "Paiement",
  en: "Payment",
}

// ========================================================
// FORMATION PAYMENT
// ========================================================

if (kind === "formation") {
  if (!targetSlug) {
    return Response.json(
      {
        ok: false,
        provider: "pawapay",

        error:
          "Missing course.",
      },
      {
        status: 400,
      },
    )
  }

  const formation =
    await getFormationBySlug(
      targetSlug,
    )

  if (!formation) {
    return Response.json(
      {
        ok: false,
        provider: "pawapay",

        error:
          "Course not found.",
      },
      {
        status: 404,
      },
    )
  }

  amountUsd =
    formation.priceUsd

  label = {
    fr: formation.title.fr,
    en: formation.title.en,
  }
}

// ========================================================
// SUBSCRIPTION PAYMENT
// ========================================================

else if (
  kind === "subscription"
) {
  /**
   * Server-controlled subscription price.
   *
   * Move this to your pricing configuration
   * or database when subscriptions have
   * multiple plans.
   */
  amountUsd = 15

  label = {
    fr: "Abonnement étudiant",
    en: "Student subscription",
  }
}

// ========================================================
// EVENT PAYMENT
// ========================================================

else if (
  kind === "event"
) {
  if (!targetSlug) {
    return Response.json(
      {
        ok: false,
        provider: "pawapay",

        error:
          "Missing event.",
      },
      {
        status: 400,
      },
    )
  }

  // ======================================================
  // FIND REGISTERED EVENT
  // ======================================================

  const event =
    EVENTS[
      targetSlug as keyof typeof EVENTS
    ]

  if (!event) {
    return Response.json(
      {
        ok: false,
        provider: "pawapay",

        error:
          "Event not found.",
      },
      {
        status: 404,
      },
    )
  }

  // ======================================================
  // TRUSTED EVENT PRICE
  // ======================================================

  amountUsd =
    event.priceUsd

  label =
    event.label
}

// ========================================================
// PROJECT PAYMENT
// ========================================================

else if (
  kind === "project"
) {
  /**
   * Project payments should never use
   * arbitrary client-side prices.
   *
   * Implement this using an approved quote,
   * invoice, or project payment record.
   */
  return Response.json(
    {
      ok: false,
      provider: "pawapay",

      error:
        "Project payments require an approved quote with a valid amount.",
    },
    {
      status: 400,
    },
  )
}

// ========================================================
// UNSUPPORTED PAYMENT TYPE
// ========================================================

else {
  return Response.json(
    {
      ok: false,
      provider: "pawapay",

      error:
        "Unsupported payment type.",
    },
    {
      status: 400,
    },
  )
}

// ========================================================
// VALIDATE SERVER-CALCULATED AMOUNT
// ========================================================

if (
  !Number.isFinite(
    amountUsd,
  ) ||
  amountUsd <= 0
) {
  console.error(
    "Invalid server-calculated payment amount:",
    {
      kind,
      targetSlug,
      amountUsd,
    },
  )

  return Response.json(
    {
      ok: false,
      provider: "pawapay",

      error:
        "Invalid payment amount.",
    },
    {
      status: 400,
    },
  )
}

// ========================================================
// CREATE UNIQUE PAYMENT REFERENCE
// ========================================================

const reference =
  randomUUID()

// ========================================================
// INITIATE PAWAPAY PAYMENT
// ========================================================

const result =
  await initiatePayment({
    reference,

    /**
     * Trusted USD amount.
     *
     * The payment provider implementation
     * converts this to the appropriate local
     * currency when necessary.
     */
    amountUsd,

    country,
    phone,
    network,
  })

// ========================================================
// RESOLVE TRUSTED PAYMENT VALUES
// ========================================================

const paymentCurrency =
  result.currency ?? "USD"

const paymentCountry =
  result.country ?? country

const paymentAmount =
  result.amount ?? amountUsd

// ========================================================
// SAVE PAYMENT
//
// Save both successful and unsuccessful
// provider requests for transaction history,
// reconciliation and debugging.
// ========================================================

if (isDbConfigured()) {
  try {
    const collection =
      await payments()

    await collection.insertOne({
      reference,

      userId:
        session?.userId ??
        undefined,

      provider:
        "pawapay",

      /**
       * Official payment type.
       *
       * "event" is used consistently across
       * the frontend, API and database.
       */
      kind: paymentKind,

      targetSlug,

      label,

      /**
       * Original server-calculated USD price.
       */
      amountUsd,

      /**
       * Final amount sent to PawaPay.
       */
      amount:
        paymentAmount,

      currency:
        paymentCurrency,

      country:
        paymentCountry,

      exchangeRate:
        result.exchangeRate ??
        undefined,

      phone,

      network:
        network ??
        undefined,

      status:
        result.status,

      providerRef:
        result.providerRef ??
        undefined,

      createdAt:
        new Date(),

      updatedAt:
        new Date(),
    })
  } catch (error) {
    /**
     * The payment request has already been
     * sent to the provider.
     *
     * Do not automatically fail the payment
     * simply because logging failed.
     */
    console.error(
      "Unable to save payment:",
      error,
    )
  }
}

// ========================================================
// RETURN PAYMENT RESPONSE
// ========================================================

return Response.json(
  {
    ok: result.ok,

    provider:
      "pawapay",

    reference,

    status:
      result.status,

    providerRef:
      result.providerRef,

    /**
     * Trusted server-calculated USD amount.
     */
    amountUsd,

    /**
     * Final provider payment amount.
     */
    amount:
      paymentAmount,

    currency:
      paymentCurrency,

    country:
      paymentCountry,

    exchangeRate:
      result.exchangeRate,

    error:
      result.error,
  },
  {
    status:
      result.ok
        ? 200
        : 400,
  },
)


} catch (error) {
console.error(
"PawaPay payment route error:",
error,
)


return Response.json(
  {
    ok: false,
    provider: "pawapay",

    error:
      error instanceof Error
        ? error.message
        : "Unable to initiate payment.",
  },
  {
    status: 500,
  },
)


}
}
