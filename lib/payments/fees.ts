// Payout fee charged on teacher payouts, deducted from the payout amount:
// 3.5% below $120, 2.6% from $120 upward.

export const PAYOUT_FEE_THRESHOLD_USD = 120
export const PAYOUT_FEE_LOW_RATE = 0.035
export const PAYOUT_FEE_HIGH_RATE = 0.026
export const MIN_PAYOUT_USD = 10

const cents = (n: number) => Math.round(n * 100) / 100

export function payoutFee(amountUsd: number) {
  const rate = amountUsd < PAYOUT_FEE_THRESHOLD_USD ? PAYOUT_FEE_LOW_RATE : PAYOUT_FEE_HIGH_RATE
  const feeUsd = cents(amountUsd * rate)
  return { rate, feeUsd, netUsd: cents(amountUsd - feeUsd) }
}

/** Admin commission on each sale of a teacher's own course; the teacher keeps the rest. */
/** Certified Teacher badge: blue check, priority placement. 100% platform revenue. */
export const TEACHER_BADGE_PRICE_USD = 7.9
export const TEACHER_BADGE_DAYS = 30

export const PLATFORM_COMMISSION_RATE = 0.1
export const PLATFORM_COMMISSION_PERCENT = Math.round(PLATFORM_COMMISSION_RATE * 100)
export const TEACHER_SHARE_PERCENT = 100 - PLATFORM_COMMISSION_PERCENT

/**
 * Teacher's share of a sale of a course they created (90%). Courses created
 * by the admin or by AI, certificates and Academy courses go 100% to the platform.
 */
export function teacherRevenueShare(): number {
  return 1 - PLATFORM_COMMISSION_RATE
}
