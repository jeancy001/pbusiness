
import { NextRequest } from "next/server"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer"

import { isDbConfigured } from "@/lib/db/mongodb"

import {
  tickets,
  type TicketDoc,
} from "@/lib/db/models"

// ============================================================
// ROUTE CONFIGURATION
// ============================================================

export const runtime = "nodejs"

export const dynamic = "force-dynamic"

export const revalidate = 0

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  page: {
    width: 250,
    height: 420,
    padding: 18,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },

  header: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  brand: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 4,
  },

  title: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },

  ticketCode: {
    marginTop: 6,
    fontSize: 7,
    color: "#64748b",
  },

  section: {
    marginTop: 12,
  },

  label: {
    fontSize: 7,
    color: "#64748b",
    marginBottom: 3,
  },

  value: {
    fontSize: 9,
    color: "#111827",
  },

  eventName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    lineHeight: 1.35,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 12,
  },

  column: {
    width: "48%",
  },

  priceBox: {
    marginTop: 18,
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
  },

  priceLabel: {
    fontSize: 7,
    color: "#64748b",
  },

  price: {
    marginTop: 3,
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },

  status: {
    marginTop: 14,
    padding: 8,
    borderRadius: 5,
    backgroundColor: "#ecfdf5",
    color: "#047857",
    fontSize: 8,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
  },

  reference: {
    marginTop: 8,
    fontSize: 6,
    color: "#64748b",
    textAlign: "center",
  },

  verificationBox: {
    marginTop: 16,
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },

  verificationCode: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#111827",
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    textAlign: "center",
  },

  verificationText: {
    marginTop: 7,
    fontSize: 6,
    color: "#64748b",
    textAlign: "center",
  },

  footer: {
    marginTop: "auto",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },

  footerText: {
    fontSize: 6,
    color: "#94a3b8",
    textAlign: "center",
  },
})

// ============================================================
// HELPERS
// ============================================================

const ZERO_DECIMAL_CURRENCIES = new Set([
  "CDF",
  "KES",
  "UGX",
  "TZS",
  "RWF",
  "XAF",
  "XOF",
])

function formatDate(
  value: Date | string | undefined | null,
): string {
  if (!value) {
    return "À confirmer"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "À confirmer"
  }

  try {
    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    ).format(date)
  } catch {
    return date.toLocaleDateString("fr-FR")
  }
}

function formatAmount(
  amount: number,
  currency: string,
): string {
  const normalizedCurrency =
    currency.trim().toUpperCase()

  const hasZeroDecimals =
    ZERO_DECIMAL_CURRENCIES.has(
      normalizedCurrency,
    )

  const safeAmount =
    Number.isFinite(amount) && amount >= 0
      ? amount
      : 0

  try {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style: "currency",
        currency: normalizedCurrency,
        minimumFractionDigits:
          hasZeroDecimals ? 0 : 2,
        maximumFractionDigits:
          hasZeroDecimals ? 0 : 2,
      },
    ).format(
      hasZeroDecimals
        ? Math.round(safeAmount)
        : safeAmount,
    )
  } catch {
    const formatted =
      hasZeroDecimals
        ? Math.round(
            safeAmount,
          ).toLocaleString("fr-FR")
        : safeAmount.toLocaleString(
            "fr-FR",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )

    return `${formatted} ${normalizedCurrency}`
  }
}

function getEventName(
  ticket: TicketDoc,
): string {
  const frenchName =
    ticket.eventName?.fr?.trim()

  const englishName =
    ticket.eventName?.en?.trim()

  return (
    frenchName ||
    englishName ||
    "Formation"
  )
}

function getDurationLabel(
  duration?: string,
): string {
  const value =
    duration?.trim()

  return value || "À confirmer"
}

function sanitizeTicketCode(
  value: string,
): string {
  return decodeURIComponent(
    value,
  ).trim()
}

// ============================================================
// PDF DOCUMENT
// ============================================================

function TicketDocument({
  ticket,
}: {
  ticket: TicketDoc
}) {
  const eventName =
    getEventName(ticket)

  const endDate =
    ticket.eventEndDate
      ? formatDate(
          ticket.eventEndDate,
        )
      : "À confirmer"

  return (
    <Document
      title={`Ticket ${ticket.ticketCode}`}
      author="PB BUSINESS"
      subject="Ticket de formation"
      creator="PB BUSINESS"
    >
      <Page
        size={{
          width: 250,
          height: 420,
        }}
        style={styles.page}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Text style={styles.brand}>
            PB BUSINESS • UNIKIN
          </Text>

          <Text style={styles.title}>
            TICKET DE FORMATION
          </Text>

          <Text style={styles.ticketCode}>
            {ticket.ticketCode}
          </Text>
        </View>

        {/* PARTICIPANT */}

        <View style={styles.section}>
          <Text style={styles.label}>
            PARTICIPANT
          </Text>

          <Text style={styles.value}>
            {ticket.studentName}
          </Text>
        </View>

        {/* EVENT */}

        <View style={styles.section}>
          <Text style={styles.label}>
            FORMATION / ÉVÉNEMENT
          </Text>

          <Text style={styles.eventName}>
            {eventName}
          </Text>
        </View>

        {/* DURATION + LOCATION */}

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>
              DURÉE
            </Text>

            <Text style={styles.value}>
              {getDurationLabel(
                ticket.formationDuration,
              )}
            </Text>
          </View>

          <View style={styles.column}>
            <Text style={styles.label}>
              LIEU
            </Text>

            <Text style={styles.value}>
              {ticket.location ||
                "UNIKIN"}
            </Text>
          </View>
        </View>

        {/* DATES */}

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>
              DATE
            </Text>

            <Text style={styles.value}>
              {formatDate(
                ticket.eventDate,
              )}
            </Text>
          </View>

          <View style={styles.column}>
            <Text style={styles.label}>
              FIN
            </Text>

            <Text style={styles.value}>
              {endDate}
            </Text>
          </View>
        </View>

        {/* PRICE */}

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>
            MONTANT PAYÉ
          </Text>

          <Text style={styles.price}>
            {formatAmount(
              ticket.amount,
              ticket.currency,
            )}
          </Text>
        </View>

        {/* PAYMENT STATUS */}

        <Text style={styles.status}>
          ✓ PAIEMENT CONFIRMÉ
        </Text>

        {/* PAYMENT REFERENCE */}

        <Text style={styles.reference}>
          Référence :{" "}
          {ticket.paymentReference}
        </Text>

        {/* VERIFICATION CODE */}

        <View
          style={styles.verificationBox}
        >
          <Text
            style={
              styles.verificationCode
            }
          >
            {ticket.ticketCode}
          </Text>

          <Text
            style={
              styles.verificationText
            }
          >
            Présentez ce code à
            l'entrée pour vérification.
          </Text>
        </View>

        {/* FOOTER */}

        <View style={styles.footer}>
          <Text
            style={
              styles.footerText
            }
          >
            PB BUSINESS × UNIKIN
          </Text>

          <Text
            style={
              styles.footerText
            }
          >
            Ce ticket est personnel et
            valable pour une seule entrée.
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// ============================================================
// GET TICKET PDF
//
// Route:
// /api/tickets/[ticketCode]/pdf
// ============================================================

export async function GET(
  _req: NextRequest,

  {
    params,
  }: {
    params: Promise<{
      ticketCode: string
    }>
  },
) {
  try {
    // ========================================================
    // DATABASE CHECK
    // ========================================================

    if (!isDbConfigured()) {
      return Response.json(
        {
          ok: false,
          error:
            "Database is not configured.",
        },
        {
          status: 503,
        },
      )
    }

    // ========================================================
    // GET PARAMETERS
    // ========================================================

    const {
      ticketCode: rawTicketCode,
    } = await params

    let ticketCode = ""

    try {
      ticketCode =
        sanitizeTicketCode(
          rawTicketCode,
        )
    } catch {
      return Response.json(
        {
          ok: false,
          error:
            "Invalid ticket code.",
        },
        {
          status: 400,
        },
      )
    }

    if (!ticketCode) {
      return Response.json(
        {
          ok: false,
          error:
            "Missing ticket code.",
        },
        {
          status: 400,
        },
      )
    }

    // ========================================================
    // FIND TICKET
    // ========================================================

    const collection =
      await tickets()

    const ticket =
      await collection.findOne({
        ticketCode,
      })

    if (!ticket) {
      return Response.json(
        {
          ok: false,
          error:
            "Ticket not found.",
        },
        {
          status: 404,
        },
      )
    }

    // ========================================================
    // SECURITY
    //
    // Only active tickets can generate
    // a downloadable PDF.
    // ========================================================

    if (
      ticket.status !== "active"
    ) {
      const error =
        ticket.status === "used"
          ? "This ticket has already been used."
          : ticket.status ===
              "cancelled"
            ? "This ticket has been cancelled."
            : "This ticket is no longer valid."

      return Response.json(
        {
          ok: false,
          error,
        },
        {
          status: 403,
        },
      )
    }

    // ========================================================
    // GENERATE PDF
    // ========================================================

    const document = (
      <TicketDocument
        ticket={ticket}
      />
    )

    const pdfInstance =
      pdf(document)

    const blob =
      await pdfInstance.toBlob()

    const arrayBuffer =
      await blob.arrayBuffer()

    const buffer =
      Buffer.from(arrayBuffer)

    // ========================================================
    // RESPONSE
    // ========================================================

    return new Response(
      buffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `inline; filename="${ticket.ticketCode}.pdf"`,

          "Content-Length":
            String(buffer.length),

          "Cache-Control":
            "private, no-store, max-age=0",

          "X-Content-Type-Options":
            "nosniff",
        },
      },
    )
  } catch (error) {
    console.error(
      "Ticket PDF generation error:",
      error,
    )

    return Response.json(
      {
        ok: false,

        error:
          "Unable to generate ticket PDF.",
      },
      {
        status: 500,
      },
    )
  }
}

