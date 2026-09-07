
import { randomUUID } from "crypto"
import { z } from "zod"

import { isDbConfigured } from "@/lib/db/mongodb"
import { payments } from "@/lib/db/models"

import { getSession } from "@/lib/auth/session"
import { getFormationBySlug } from "@/lib/data/catalog"

import {
  initiatePayment,
  pawapayConfigured,
} from "@/lib/payments/providers"

// ============================================================
// REQUEST VALIDATION
// ============================================================

const schema = z.object({
  kind: z.enum([
    "formation",
    "subscription",
    "project",
  ]),

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

  /**
   * PawaPay Mobile Money provider code.
   *
   * Examples depend on the PawaPay configuration
   * available for the customer's country.
   */
  network: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .optional(),

  /**
   * ISO 3166-1 alpha-2 country code.
   */
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
    // ==========================================================
    // PAWAPAY CONFIGURATION
    // ==========================================================

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

    // ==========================================================
    // PARSE JSON SAFELY
    // ==========================================================

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

    // ==========================================================
    // VALIDATE REQUEST
    // ==========================================================

    const parsed =
      schema.safeParse(body)

    if (!parsed.success) {
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
      targetSlug,
      phone,
      network,
      country,
    } = parsed.data

    // ==========================================================
    // USER SESSION
    // ==========================================================

    const session =
      await getSession()

    // ==========================================================
    // SERVER-SIDE PRICE CALCULATION
    //
    // Never accept a payment amount directly
    // from the frontend.
    // ==========================================================

    let amountUsd = 0

    let label = {
      fr: "Paiement",
      en: "Payment",
    }

    // ==========================================================
    // FORMATION
    // ==========================================================

    if (kind === "formation") {
      if (!targetSlug) {
        return Response.json(
          {
            ok: false,
            provider: "pawapay",
            error: "Missing course.",
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
            error: "Course not found.",
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

    // ==========================================================
    // SUBSCRIPTION
    // ==========================================================

    else if (
      kind === "subscription"
    ) {
      amountUsd = 15

      label = {
        fr: "Abonnement étudiant",
        en: "Student subscription",
      }
    }

    // ==========================================================
    // PROJECT
    // ==========================================================

    else {
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

    // ==========================================================
    // VALIDATE AMOUNT
    // ==========================================================

    if (
      !Number.isFinite(amountUsd) ||
      amountUsd <= 0
    ) {
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

    // ==========================================================
    // CREATE UNIQUE PAWAPAY DEPOSIT ID
    // ==========================================================

    const reference =
      randomUUID()

    // ==========================================================
    // INITIATE PAYMENT
    //
    // The provider module must:
    //
    // - Validate the country
    // - Validate the PawaPay provider/network
    // - Resolve the supported currency
    // - Convert USD when necessary
    // - Submit the correct PawaPay V2 payload
    // ==========================================================

    const result =
      await initiatePayment({
        reference,
        amountUsd,
        country,
        phone,
        network,
      })

    // ==========================================================
    // RESOLVE DATABASE VALUES
    // ==========================================================

    const paymentCurrency =
      result.currency ?? "USD"

    const paymentCountry =
      result.country ?? country

    const paymentAmount =
      result.amount ?? amountUsd

    // ==========================================================
    // SAVE PAYMENT
    //
    // Save both accepted and rejected requests.
    // This is important for debugging and
    // transaction history.
    // ==========================================================

    if (isDbConfigured()) {
      try {
        const collection =
          await payments()

        await collection.insertOne({
          reference,

          userId:
            session?.userId,

          provider:
            "pawapay",

          kind,

          targetSlug,

          label,

          /**
           * Original application price.
           */
          amountUsd,

          /**
           * Amount submitted to PawaPay.
           */
          amount:
            paymentAmount,

          /**
           * Currency used for the deposit.
           */
          currency:
            paymentCurrency,

          /**
           * Customer country.
           */
          country:
            paymentCountry,

          /**
           * Conversion rate, when available.
           */
          exchangeRate:
            result.exchangeRate,

          phone,

          network,

          status:
            result.status,

          providerRef:
            result.providerRef,

          createdAt:
            new Date(),

          updatedAt:
            new Date(),
        })
      } catch (error) {
        console.error(
          "Unable to save payment:",
          error,
        )
      }
    }

    // ==========================================================
    // RETURN RESPONSE
    // ==========================================================

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

        amountUsd,

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
        /**
         * The request itself may have been accepted
         * by your application but rejected by the
         * PawaPay provider.
         *
         * We return the actual provider result to
         * the frontend.
         */
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

