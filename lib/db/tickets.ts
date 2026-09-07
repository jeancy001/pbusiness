
import { randomUUID } from "crypto"

import {
  type Collection,
} from "mongodb"

import { getDb } from "@/lib/db/mongodb"

// ============================================================
// TYPES
// ============================================================

/**
 * Training duration in weeks.
 */
export type TicketDuration =
  | 3
  | 4

/**
 * Main ticket lifecycle status.
 */
export type TicketStatus =
  | "pending"
  | "paid"
  | "cancelled"
  | "expired"
  | "checked_in"

/**
 * Payment provider status.
 */
export type TicketPaymentStatus =
  | "pending"
  | "success"
  | "failed"

/**
 * Ticket target type.
 */
export type TicketKind =
  | "formation"
  | "event"

/**
 * Ticket document.
 */
export type TicketDoc = {
  // ==========================================================
  // IDENTIFICATION
  // ==========================================================

  /**
   * Internal unique ticket ID.
   */
  ticketId: string

  /**
   * Human-readable ticket number.
   *
   * Example:
   * UNIKIN-2026-A8F92C
   */
  ticketNumber: string

  /**
   * Formation or standalone event.
   */
  kind: TicketKind

  // ==========================================================
  // EVENT INFORMATION
  // ==========================================================

  /**
   * Target event or formation.
   *
   * This structure supports both formations
   * and standalone events.
   */
  event: {
    /**
     * Internal event or formation ID.
     */
    id: string

    /**
     * URL-friendly identifier.
     */
    slug: string

    /**
     * Event or formation title.
     */
    title: {
      fr: string
      en: string
    }

    /**
     * Start date.
     */
    startDate?: Date

    /**
     * End date.
     */
    endDate?: Date

    /**
     * Duration in weeks for formations.
     */
    durationWeeks?: TicketDuration

    /**
     * Physical or online location.
     */
    location?: string
  }

  // ==========================================================
  // STUDENT INFORMATION
  // ==========================================================

  student: {
    userId?: string

    firstName: string

    lastName: string

    fullName: string

    email?: string

    phone: string

    university?: string

    faculty?: string
  }

  // ==========================================================
  // PRICING
  // ==========================================================

  pricing: {
    /**
     * Original application price in USD.
     */
    amountUsd: number

    /**
     * Final amount requested or paid
     * in the local currency.
     */
    amount: number

    /**
     * Payment currency.
     */
    currency: string

    /**
     * USD conversion rate when applicable.
     */
    exchangeRate?: number
  }

  // ==========================================================
  // PAYMENT
  // ==========================================================

  payment: {
    /**
     * Payment provider.
     */
    provider: "pawapay"

    /**
     * Internal payment reference.
     *
     * This should match the PaymentDoc
     * reference.
     */
    reference: string

    /**
     * PawaPay provider reference.
     */
    providerRef?: string

    /**
     * Current payment status.
     */
    status: TicketPaymentStatus
  }

  // ==========================================================
  // TICKET STATUS
  // ==========================================================

  status: TicketStatus

  /**
   * Secure value used to generate
   * and validate the QR code.
   */
  qrCode: string

  // ==========================================================
  // CHECK-IN
  // ==========================================================

  checkedIn: boolean

  checkedInAt?: Date

  checkedInBy?: string

  // ==========================================================
  // TIMESTAMPS
  // ==========================================================

  createdAt: Date

  updatedAt: Date
}

// ============================================================
// COLLECTION
// ============================================================

export async function tickets(): Promise<
  Collection<TicketDoc>
> {
  const db = await getDb()

  return db.collection<TicketDoc>(
    "tickets",
  )
}

// ============================================================
// TICKET ID
// ============================================================

export function generateTicketId(): string {
  return randomUUID()
}

// ============================================================
// TICKET NUMBER
// ============================================================

export function generateTicketNumber(): string {
  const year =
    new Date().getFullYear()

  const random =
    randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase()

  return `UNIKIN-${year}-${random}`
}

// ============================================================
// SECURE QR CODE VALUE
// ============================================================

export function generateTicketQrCode(
  ticketId: string,
): string {
  const secret =
    randomUUID()
      .replace(/-/g, "")
      .toUpperCase()

  return `PB-TICKET:${ticketId}:${secret}`
}

// ============================================================
// TICKET STATUS HELPERS
// ============================================================

export function isTicketValid(
  ticket: TicketDoc,
): boolean {
  return (
    ticket.status === "paid" &&
    ticket.payment.status === "success" &&
    !ticket.checkedIn
  )
}

export function canCheckInTicket(
  ticket: TicketDoc,
): boolean {
  return (
    isTicketValid(ticket) &&
    ticket.status !== "expired" &&
    ticket.status !== "cancelled"
  )
}

