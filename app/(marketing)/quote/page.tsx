import type { Metadata } from "next"
import { QuoteForm } from "@/components/quote/quote-form"

export const metadata: Metadata = {
  title: "Demander un devis",
}

export default function QuotePage() {
  return <QuoteForm />
}
