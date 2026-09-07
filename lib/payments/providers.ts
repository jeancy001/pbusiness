
import "server-only"

// ============================================================
// TYPES
// ============================================================

export type InitiateInput = {
  /**
   * Unique payment/deposit reference.
   */
  reference: string

  /**
   * Original product price in USD.
   */
  amountUsd: number

  /**
   * Customer ISO 3166-1 alpha-2 country code.
   */
  country: string

  /**
   * Customer phone number in international format.
   */
  phone: string

  /**
   * Mobile Money provider/network.
   */
  network?: string

  /**
   * Internal payment description.
   *
   * This is NOT sent to the PawaPay API.
   */
  description?: string
}

export type InitiateResult = {
  ok: boolean
  status: "pending" | "success" | "failed"

  providerRef?: string
  error?: string

  amountUsd?: number
  amount?: number
  currency?: string
  exchangeRate?: number
  country?: string
}

type CurrencyConfig = {
  currency: string
  decimals: number
  minimumAmount: number
}

// ============================================================
// COUNTRY → CURRENCY CONFIGURATION
// ============================================================

const COUNTRY_CURRENCIES: Record<
  string,
  CurrencyConfig
> = {
  CD: {
    currency: "CDF",
    decimals: 0,
    minimumAmount: 1,
  },

  KE: {
    currency: "KES",
    decimals: 2,
    minimumAmount: 1,
  },

  UG: {
    currency: "UGX",
    decimals: 0,
    minimumAmount: 1,
  },

  TZ: {
    currency: "TZS",
    decimals: 0,
    minimumAmount: 1,
  },

  RW: {
    currency: "RWF",
    decimals: 0,
    minimumAmount: 1,
  },

  GH: {
    currency: "GHS",
    decimals: 2,
    minimumAmount: 1,
  },

  ZM: {
    currency: "ZMW",
    decimals: 2,
    minimumAmount: 1,
  },

  CM: {
    currency: "XAF",
    decimals: 0,
    minimumAmount: 1,
  },

  CG: {
    currency: "XAF",
    decimals: 0,
    minimumAmount: 1,
  },

  SN: {
    currency: "XOF",
    decimals: 0,
    minimumAmount: 1,
  },

  CI: {
    currency: "XOF",
    decimals: 0,
    minimumAmount: 1,
  },
}

// ============================================================
// PAWAPAY CONFIGURATION
// ============================================================

function pawapayBase(): string {
  return (
    process.env.PAWAPAY_BASE_URL?.trim() ||
    "https://api.sandbox.pawapay.io"
  ).replace(/\/$/, "")
}

function pawapayToken(): string {
  return (
    process.env.PAWAPAY_API_TOKEN?.trim() ||
    ""
  )
}

export function pawapayConfigured(): boolean {
  return Boolean(pawapayToken())
}

// ============================================================
// HELPERS
// ============================================================

function normalizeCountry(
  country: string,
): string {
  return country.trim().toUpperCase()
}

function getCurrencyConfig(
  country: string,
): CurrencyConfig | null {
  return COUNTRY_CURRENCIES[country] ?? null
}

function normalizePhone(
  phone: string,
): string {
  return phone
    .trim()
    .replace(/[^\d+]/g, "")
}

// ============================================================
// EXCHANGE RATE
// ============================================================

async function getExchangeRate(
  currency: string,
): Promise<number> {
  if (currency === "USD") {
    return 1
  }

  const environmentKey =
    `FX_USD_${currency}`

  const value =
    process.env[environmentKey]

  if (value) {
    const rate = Number(value)

    if (
      Number.isFinite(rate) &&
      rate > 0
    ) {
      return rate
    }
  }

  throw new Error(
    `Exchange rate unavailable for USD → ${currency}. ` +
      `Please configure ${environmentKey}.`,
  )
}

// ============================================================
// AMOUNT CONVERSION
// ============================================================

function convertAmount(
  amountUsd: number,
  exchangeRate: number,
  config: CurrencyConfig,
): number {
  if (
    !Number.isFinite(amountUsd) ||
    amountUsd <= 0
  ) {
    throw new Error(
      "Payment amount must be greater than zero.",
    )
  }

  if (
    !Number.isFinite(exchangeRate) ||
    exchangeRate <= 0
  ) {
    throw new Error(
      "Invalid exchange rate.",
    )
  }

  const converted =
    amountUsd * exchangeRate

  const amount = Number(
    converted.toFixed(config.decimals),
  )

  return Math.max(
    amount,
    config.minimumAmount,
  )
}

// ============================================================
// STATUS MAPPING
// ============================================================

function normalizeStatus(
  rawStatus?: string,
): InitiateResult["status"] {
  const status =
    rawStatus
      ?.trim()
      .toUpperCase()

  switch (status) {
    case "COMPLETED":
    case "SUCCESS":
      return "success"

    case "FAILED":
    case "REJECTED":
    case "CANCELLED":
    case "EXPIRED":
      return "failed"

    case "ACCEPTED":
    case "PENDING":
    case "PROCESSING":
    case "INITIATED":
      return "pending"

    default:
      return "pending"
  }
}

// ============================================================
// INITIATE PAWAPAY DEPOSIT
// ============================================================

export async function initiatePayment(
  input: InitiateInput,
): Promise<InitiateResult> {
  if (!pawapayConfigured()) {
    return {
      ok: false,
      status: "failed",
      error:
        "PawaPay is not configured. Please configure PAWAPAY_API_TOKEN.",
    }
  }

  try {
    // ========================================================
    // COUNTRY
    // ========================================================

    const country =
      normalizeCountry(input.country)

    const currencyConfig =
      getCurrencyConfig(country)

    if (!currencyConfig) {
      return {
        ok: false,
        status: "failed",
        country,
        error:
          `Payments are not currently supported for country "${country}".`,
      }
    }

    // ========================================================
    // PHONE
    // ========================================================

    const phone =
      normalizePhone(input.phone)

    if (phone.length < 6) {
      return {
        ok: false,
        status: "failed",
        country,
        error:
          "Please provide a valid phone number.",
      }
    }

    // ========================================================
    // EXCHANGE RATE
    // ========================================================

    const exchangeRate =
      await getExchangeRate(
        currencyConfig.currency,
      )

    // ========================================================
    // USD → LOCAL CURRENCY
    // ========================================================

    const amount =
      convertAmount(
        input.amountUsd,
        exchangeRate,
        currencyConfig,
      )

    console.log(
      "PawaPay payment conversion",
      {
        reference: input.reference,
        country,
        amountUsd: input.amountUsd,
        currency: currencyConfig.currency,
        exchangeRate,
        amount,
      },
    )

    // ========================================================
    // CREATE PAWAPAY REQUEST
    //
    // IMPORTANT:
    // Only supported PawaPay API parameters are sent.
    //
    // `description` is deliberately NOT included.
    // ========================================================

    const depositRequest = {
      depositId: input.reference,

      amount: String(amount),

      currency:
        currencyConfig.currency,

      payer: {
        type: "MMO",

        accountDetails: {
          phoneNumber: phone,

          ...(input.network
            ? {
                provider:
                  input.network.trim(),
              }
            : {}),
        },
      },
    }

    console.log(
      "PawaPay deposit request",
      {
        ...depositRequest,

        payer: {
          ...depositRequest.payer,

          accountDetails: {
            ...depositRequest.payer
              .accountDetails,

            phoneNumber:
              "[REDACTED]",
          },
        },
      },
    )

    // ========================================================
    // SEND DEPOSIT REQUEST
    // ========================================================

    const response =
      await fetch(
        `${pawapayBase()}/v2/deposits`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${pawapayToken()}`,

            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify(
            depositRequest,
          ),

          cache: "no-store",
        },
      )

    const rawText =
      await response.text()

    let data: {
      status?: string
      depositId?: string
      message?: string
      error?: string
      failureReason?: {
        failureCode?: string
        failureMessage?: string
      }
    } = {}

    try {
      data =
        rawText
          ? JSON.parse(rawText)
          : {}
    } catch {
      console.error(
        "PawaPay returned invalid JSON:",
        rawText,
      )
    }

    // ========================================================
    // HANDLE PAWAPAY ERROR
    // ========================================================

    if (!response.ok) {
      console.error(
        "PawaPay initiate error:",
        response.status,
        data,
      )

      const failureMessage =
        data.failureReason?.failureMessage

      const failureCode =
        data.failureReason?.failureCode

      return {
        ok: false,
        status: "failed",

        amountUsd:
          input.amountUsd,

        amount,

        currency:
          currencyConfig.currency,

        exchangeRate,

        country,

        providerRef:
          data.depositId ||
          input.reference,

        error:
          failureMessage ||
          data.message ||
          data.error ||
          (failureCode
            ? `PawaPay error: ${failureCode}`
            : `PawaPay request failed with status ${response.status}`),
      }
    }

    // ========================================================
    // SUCCESSFUL REQUEST
    // ========================================================

    const status =
      normalizeStatus(
        data.status,
      )

    console.log(
      "PawaPay deposit response",
      {
        status: response.status,
        data,
      },
    )

    return {
      ok: true,

      status,

      providerRef:
        data.depositId ||
        input.reference,

      amountUsd:
        input.amountUsd,

      amount,

      currency:
        currencyConfig.currency,

      exchangeRate,

      country,
    }
  } catch (error) {
    console.error(
      "PawaPay payment error:",
      error,
    )

    return {
      ok: false,
      status: "failed",

      error:
        error instanceof Error
          ? error.message
          : "Unable to process the PawaPay payment.",
    }
  }
}

// ============================================================
// CHECK PAWAPAY PAYMENT STATUS
// ============================================================

export async function checkPayment(
  reference: string,
): Promise<InitiateResult> {
  if (!pawapayConfigured()) {
    return {
      ok: false,
      status: "failed",
      error:
        "PawaPay is not configured.",
    }
  }

  try {
    const response =
      await fetch(
        `${pawapayBase()}/v2/deposits/${encodeURIComponent(
          reference,
        )}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${pawapayToken()}`,

            Accept:
              "application/json",
          },

          cache: "no-store",
        },
      )

    const rawText =
      await response.text()

    let data: {
      status?: string
      depositId?: string
      message?: string
      error?: string

      failureReason?: {
        failureCode?: string
        failureMessage?: string
      }

      data?: {
        status?: string
        depositId?: string
      }
    } = {}

    try {
      data =
        rawText
          ? JSON.parse(rawText)
          : {}
    } catch {
      console.error(
        "Invalid PawaPay status response:",
        rawText,
      )
    }

    if (!response.ok) {
      console.error(
        "PawaPay status error:",
        response.status,
        data,
      )

      return {
        ok: false,
        status: "failed",

        error:
          data.failureReason?.failureMessage ||
          data.message ||
          data.error ||
          `Unable to check payment status (${response.status}).`,
      }
    }

    const rawStatus =
      data.status ||
      data.data?.status

    return {
      ok: true,

      status:
        normalizeStatus(
          rawStatus,
        ),

      providerRef:
        data.depositId ||
        data.data?.depositId ||
        reference,
    }
  } catch (error) {
    console.error(
      "PawaPay status network error:",
      error,
    )

    return {
      ok: false,
      status: "failed",

      error:
        error instanceof Error
          ? error.message
          : "Unable to connect to PawaPay.",
    }
  }
}

