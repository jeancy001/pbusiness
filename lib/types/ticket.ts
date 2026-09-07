export type TrainingDuration = 3 | 4

export type TicketStatus =
| "pending"
| "paid"
| "cancelled"
| "expired"

export type TicketPaymentStatus =
| "pending"
| "success"
| "failed"

export type StudentTicket = {
/**

* Unique ticket identifier.
  */
  ticketId: string

/**

* Human-readable ticket number.
*
* Example:
* UNIKIN-2026-AB12CD
  */
  ticketNumber: string

/**

* Unique payment reference.
  */
  paymentReference?: string

/**

* Student information.
  */
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

/**

* Event or training information.
  */
  formation: {
  id: string


slug: string



title: {
  fr: string
  en: string
}

description?: {
  fr: string
  en: string
}

/**
 * Training duration in weeks.
 */
durationWeeks: TrainingDuration

startDate: Date

endDate: Date

location?: string


}

/**

* Ticket pricing.
  */
  pricing: {
  amountUsd: number


amount?: number



currency: string

exchangeRate?: number


}

/**

* Ticket state.
  */
  status: TicketStatus

/**

* Payment state.
  */
  paymentStatus: TicketPaymentStatus

/**

* Mobile Money provider.
  */
  paymentProvider?: "pawapay"

/**

* Generated QR code value.
*
* This value can be encoded into a QR code.
  */
  qrCode: string

/**

* Ticket validation.
  */
  checkedIn: boolean

checkedInAt?: Date

createdAt: Date

updatedAt: Date
}
