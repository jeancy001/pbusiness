"use client"

export function RevenueChart({ data }: { data: { month: string; usd: number }[] }) {
  const max = Math.max(...data.map((m) => m.usd))

  return (
    <div className="flex h-56 items-end gap-2 sm:gap-3" role="img" aria-label="Revenue by month">
      {data.map((m) => (
        <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            ${(m.usd / 1000).toFixed(1)}k
          </span>
          <div
            className="w-full rounded-t-md bg-primary/80 transition-all hover:bg-primary"
            style={{ height: `${Math.max(4, (m.usd / max) * 100)}%` }}
            title={`$${m.usd.toLocaleString()}`}
          />
          <span className="text-xs text-muted-foreground">{m.month}</span>
        </div>
      ))}
    </div>
  )
}
