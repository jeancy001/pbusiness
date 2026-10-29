// Swychr's mobile_format and applicable_mobileno_length disagree across
// countries (CM: "2376XXXXXXXX" but 9 digits; GH: "233XXXXXXXXX" and 12),
// so the expected length wins and we add/strip the calling code to match.

const CALLING_CODES: Record<string, string> = {
  BF: "226", BJ: "229", CD: "243", CG: "242", CI: "225", CM: "237", GA: "241", GH: "233", GN: "224",
  KE: "254", ML: "223", NE: "227", NG: "234", RW: "250", SN: "221", TG: "228", TZ: "255", UG: "256",
  ZA: "27", ZM: "260",
}

export function normalizeMobile(country: string, input: string, expectedLength: number): string | null {
  const digits = input.replace(/[^0-9]/g, "")
  if (!expectedLength) return digits.length >= 6 ? digits : null
  if (digits.length === expectedLength) return digits

  const cc = CALLING_CODES[country] ?? ""
  const local = (cc && digits.startsWith(cc) ? digits.slice(cc.length) : digits).replace(/^0+/, "")
  if (local.length === expectedLength) return local
  if (cc && (cc + local).length === expectedLength) return cc + local
  return null
}
