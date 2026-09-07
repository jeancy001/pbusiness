
"use client"

import type { ReactNode } from "react"

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  MapPin,
  Ticket,
  User,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import type {
  TicketDoc,
  TicketStatus,
} from "@/lib/db/models"

// ============================================================
// PROPS
// ============================================================

type TicketCardProps = {
  ticket: TicketDoc
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(
  value: Date | string | undefined,
): string {
  if (!value) {
    return "Date à confirmer"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Date à confirmer"
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date)
}

function formatAmount(
  amount: number,
  currency: string,
): string {
  const noDecimalCurrencies = [
    "CDF",
    "KES",
    "UGX",
    "TZS",
    "RWF",
    "XAF",
    "XOF",
  ]

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits:
        noDecimalCurrencies.includes(currency)
          ? 0
          : 2,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString(
      "fr-FR",
    )} ${currency}`
  }
}

function getEventName(
  ticket: TicketDoc,
): string {
  return (
    ticket.eventName.fr ||
    ticket.eventName.en ||
    "Événement"
  )
}

function getStatusLabel(
  status: TicketStatus,
): string {
  const labels: Record<
    TicketStatus,
    string
  > = {
    active: "Confirmé",
    used: "Utilisé",
    cancelled: "Annulé",
  }

  return labels[status]
}

function getStatusClasses(
  status: TicketStatus,
): string {
  switch (status) {
    case "active":
      return "bg-green-500/10 text-green-600"

    case "used":
      return "bg-blue-500/10 text-blue-600"

    case "cancelled":
      return "bg-destructive/10 text-destructive"
  }
}

// ============================================================
// COMPONENT
// ============================================================

export function TicketCard({
  ticket,
}: TicketCardProps) {
  const eventName =
    getEventName(ticket)

  const isActive =
    ticket.status === "active"

  const statusLabel =
    getStatusLabel(ticket.status)

  const statusClasses =
    getStatusClasses(ticket.status)

  return (
    <article className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* TOP ACCENT */}

      <div className="h-2 bg-primary" />

      {/* HEADER */}

      <div className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Ticket className="size-4 text-primary" />

            PB BUSINESS × UNIKIN
          </div>

          <h3 className="mt-2 font-heading text-xl font-bold">
            Ticket de formation
          </h3>
        </div>

        <div
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusClasses}`}
        >
          {ticket.status === "active" ? (
            <CheckCircle2 className="size-3.5" />
          ) : (
            <XCircle className="size-3.5" />
          )}

          {statusLabel}
        </div>
      </div>

      {/* CONTENT */}

      <div className="space-y-5 p-5">
        {/* PARTICIPANT */}

        <TicketInfo
          icon={
            <User className="size-4" />
          }
          label="Participant"
          value={ticket.studentName}
        />

        {/* EMAIL */}

        {ticket.studentEmail && (
          <TicketInfo
            icon={
              <User className="size-4" />
            }
            label="Email"
            value={ticket.studentEmail}
          />
        )}

        {/* INSTITUTION */}

        {ticket.institution && (
          <TicketInfo
            icon={
              <User className="size-4" />
            }
            label="Institution"
            value={ticket.institution}
          />
        )}

        {/* EVENT */}

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Formation / Événement
          </p>

          <h4 className="mt-1 text-lg font-bold">
            {eventName}
          </h4>
        </div>

        {/* DATE + DURATION */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TicketInfo
            icon={
              <CalendarDays className="size-4" />
            }
            label="Date"
            value={formatDate(
              ticket.eventDate,
            )}
          />

          <TicketInfo
            icon={
              <Clock3 className="size-4" />
            }
            label="Durée"
            value={
              ticket.formationDuration
            }
          />
        </div>

        {/* END DATE */}

        {ticket.eventEndDate && (
          <TicketInfo
            icon={
              <CalendarDays className="size-4" />
            }
            label="Date de fin"
            value={formatDate(
              ticket.eventEndDate,
            )}
          />
        )}

        {/* LOCATION */}

        <TicketInfo
          icon={
            <MapPin className="size-4" />
          }
          label="Lieu"
          value={ticket.location}
        />

        {/* PAYMENT */}

        <div className="rounded-xl bg-muted/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Montant payé
          </p>

          <p className="mt-1 text-2xl font-bold">
            {formatAmount(
              ticket.amount,
              ticket.currency,
            )}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Prix initial : $
            {ticket.amountUsd.toFixed(2)} USD
          </p>
        </div>

        {/* TICKET CODE */}

        <div className="border-t border-dashed border-border pt-5 text-center">
          <p className="text-xs text-muted-foreground">
            Code du ticket
          </p>

          <p className="mt-2 break-all font-mono text-lg font-bold tracking-wider">
            {ticket.ticketCode}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Présentez ce code à l'entrée de la
            formation.
          </p>
        </div>
      </div>

      {/* FOOTER */}

      <div className="border-t border-border bg-muted/30 p-4">
        {isActive ? (
          <Button
            className="w-full gap-2"
            asChild
          >
            <a
              href={`/api/tickets/${encodeURIComponent(
                ticket.ticketCode,
              )}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="size-4" />

              Télécharger le ticket PDF
            </a>
          </Button>
        ) : (
          <Button
            className="w-full gap-2"
            disabled
          >
            <Download className="size-4" />

            Ticket indisponible
          </Button>
        )}

        {/* PAYMENT REFERENCE */}

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Référence paiement
          </p>

          <p className="mt-1 break-all font-mono text-xs font-medium">
            {ticket.paymentReference}
          </p>
        </div>
      </div>
    </article>
  )
}

// ============================================================
// TICKET INFO
// ============================================================

function TicketInfo({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}

        <span>{label}</span>
      </div>

      <p className="mt-1 break-words font-medium">
        {value}
      </p>
    </div>
  )
}

