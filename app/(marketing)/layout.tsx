import type React from 'react'
import { AssistantWidget } from '@/components/ai/assistant-widget'
import { Footer } from '@/components/site/footer'
import { Navbar } from '@/components/site/navbar'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <AssistantWidget />
    </div>
  )
}
