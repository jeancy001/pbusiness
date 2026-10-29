"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Table2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

// Small dependency-free SVG chart kit for the dashboards.
// Conventions (data-viz method): one y-axis, thin marks with 4px rounded
// data-ends, 2px surface gaps between stacked segments, recessive grid,
// hover tooltip on every mark, a legend for >= 2 series and a table view.
// Colors come from CSS tokens (--series-*), validated in light and dark.

export type Series = { key: string; label: string; color: string }
export type Datum = { label: string; values: Record<string, number> }

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

/** "Nice" axis maximum and ticks (1, 2, 2.5, 5 × 10^n). */
function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0, 1]
  const raw = max / count
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw
  const top = Math.ceil(max / step) * step
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => +(i * step).toFixed(6))
}

// ============================================================
// CARD — title, legend, table toggle
// ============================================================

export function ChartCard({
  title,
  subtitle,
  series,
  table,
  className,
  children,
}: {
  title: string
  subtitle?: string
  series?: Series[]
  table?: { columns: string[]; rows: (string | number)[][] }
  className?: string
  children: React.ReactNode
}) {
  const { locale } = useI18n()
  const [showTable, setShowTable] = useState(false)
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-semibold">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {table && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            aria-pressed={showTable}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Table2 className="size-3.5" />
            {showTable ? (locale === "fr" ? "Graphique" : "Chart") : locale === "fr" ? "Données" : "Data"}
          </button>
        )}
      </header>
      {series && series.length > 1 && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        {showTable && table ? (
          <div className="max-h-72 overflow-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted text-left text-xs text-muted-foreground">
                <tr>
                  {table.columns.map((c, i) => (
                    <th key={c} className={cn("px-3 py-2 font-medium", i > 0 && "text-right")}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {table.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((v, j) => (
                      <td key={j} className={cn("px-3 py-1.5", j > 0 && "text-right tabular-nums")}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}

function Tooltip({ x, y, width, children }: { x: number; y: number; width: number; children: React.ReactNode }) {
  const left = Math.min(Math.max(x, 80), width - 80)
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-36 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg"
      style={{ left, top: y - 8 }}
      role="status"
    >
      {children}
    </div>
  )
}

// ============================================================
// COLUMN CHART — time series, stacked when several series
// ============================================================

export function ColumnChart({
  data,
  series,
  format = (n) => String(n),
  height = 220,
  ariaLabel,
}: {
  data: Datum[]
  series: Series[]
  format?: (n: number) => string
  height?: number
  ariaLabel: string
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const pad = { top: 8, right: 8, bottom: 26, left: 48 }
  const totals = data.map((d) => series.reduce((sum, s) => sum + (d.values[s.key] ?? 0), 0))
  const ticks = niceTicks(Math.max(0, ...totals))
  const top = ticks.at(-1) || 1
  const innerW = Math.max(0, width - pad.left - pad.right)
  const innerH = height - pad.top - pad.bottom
  const band = data.length ? innerW / data.length : 0
  const barW = Math.min(24, band * 0.6)
  const y = (v: number) => pad.top + innerH - (v / top) * innerH
  const every = Math.ceil(data.length / Math.max(1, Math.floor(innerW / 56)))

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="var(--viz-grid)" strokeWidth={1} />
              <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                {format(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = pad.left + band * i + band / 2
            let acc = 0
            const visible = series.filter((s) => (d.values[s.key] ?? 0) > 0)
            return (
              <g key={d.label} opacity={hover === null || hover === i ? 1 : 0.45}>
                {visible.map((s, k) => {
                  const v = d.values[s.key] ?? 0
                  const y0 = y(acc)
                  acc += v
                  const y1 = y(acc)
                  const last = k === visible.length - 1
                  const h = Math.max(0, y0 - y1 - (last ? 0 : 2)) // 2px surface gap between segments
                  const r = last ? Math.min(4, h / 2, barW / 2) : 0
                  const x = cx - barW / 2
                  const top1 = y1
                  return (
                    <path
                      key={s.key}
                      fill={s.color}
                      d={`M${x},${top1 + h} V${top1 + r} Q${x},${top1} ${x + r},${top1} H${x + barW - r} Q${x + barW},${top1} ${x + barW},${top1 + r} V${top1 + h} Z`}
                    />
                  )
                })}
                {i % every === 0 && (
                  <text x={cx} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                    {d.label}
                  </text>
                )}
                {/* hit target wider than the mark */}
                <rect x={cx - band / 2} y={pad.top} width={band} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${d.label}: ${format(totals[i])}`} />
              </g>
            )
          })}
          <line x1={pad.left} x2={width - pad.right} y1={y(0)} y2={y(0)} stroke="currentColor" className="text-border" />
        </svg>
      )}
      {hover !== null && data[hover] && (
        <Tooltip x={pad.left + band * hover + band / 2} y={y(totals[hover])} width={width}>
          <p className="font-medium">{data[hover].label}</p>
          {series.length > 1 &&
            series.map((s) => (
              <p key={s.key} className="mt-1 flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="size-2 rounded-sm" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="tabular-nums">{format(data[hover].values[s.key] ?? 0)}</span>
              </p>
            ))}
          <p className={cn("flex justify-between gap-4 tabular-nums", series.length > 1 && "mt-1 border-t border-border pt-1 font-semibold")}>
            {series.length > 1 && <span>Total</span>}
            <span>{format(totals[hover])}</span>
          </p>
        </Tooltip>
      )}
    </div>
  )
}

// ============================================================
// LINE CHART — single series with area and crosshair
// ============================================================

export function LineChart({
  data,
  color = "var(--series-brand)",
  format = (n) => String(n),
  height = 200,
  ariaLabel,
}: {
  data: { label: string; value: number }[]
  color?: string
  format?: (n: number) => string
  height?: number
  ariaLabel: string
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const pad = { top: 10, right: 12, bottom: 26, left: 40 }
  const ticks = niceTicks(Math.max(0, ...data.map((d) => d.value)))
  const top = ticks.at(-1) || 1
  const innerW = Math.max(0, width - pad.left - pad.right)
  const innerH = height - pad.top - pad.bottom
  const x = (i: number) => pad.left + (data.length > 1 ? (innerW * i) / (data.length - 1) : innerW / 2)
  const y = (v: number) => pad.top + innerH - (v / top) * innerH
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join(" ")
  const area = data.length ? `${line} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z` : ""
  const every = Math.ceil(data.length / Math.max(1, Math.floor(innerW / 56)))
  const gid = useMemo(() => `g${Math.random().toString(36).slice(2, 8)}`, [])

  return (
    <div
      ref={ref}
      className="relative"
      onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const i = Math.round(((e.clientX - rect.left - pad.left) / (innerW || 1)) * (data.length - 1))
        setHover(Math.max(0, Math.min(data.length - 1, i)))
      }}
    >
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible">
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="var(--viz-grid)" />
              <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                {format(t)}
              </text>
            </g>
          ))}
          <path d={area} fill={`url(#${gid})`} />
          <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {data.map((d, i) =>
            i % every === 0 ? (
              <text key={d.label} x={x(i)} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                {d.label}
              </text>
            ) : null,
          )}
          {hover !== null && data[hover] && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={y(0)} stroke="currentColor" className="text-muted-foreground/40" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(data[hover].value)} r={4.5} fill={color} stroke="var(--card)" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {hover !== null && data[hover] && (
        <Tooltip x={x(hover)} y={y(data[hover].value)} width={width}>
          <p className="font-medium">{data[hover].label}</p>
          <p className="mt-0.5 tabular-nums">{format(data[hover].value)}</p>
        </Tooltip>
      )}
    </div>
  )
}

// ============================================================
// BAR LIST — ranked horizontal bars with direct value labels
// ============================================================

export function BarList({
  items,
  max,
  format = (n) => String(n),
  color = "var(--series-brand)",
  empty,
}: {
  items: { label: string; value: number; hint?: string }[]
  max?: number
  format?: (n: number) => string
  color?: string
  empty?: string
}) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value))
  if (!items.length) return <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label} className="group" title={`${item.label}: ${format(item.value)}${item.hint ? ` · ${item.hint}` : ""}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{item.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              <span className="font-medium text-foreground">{format(item.value)}</span>
              {item.hint && <span className="ml-1.5 text-xs">{item.hint}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-500 group-hover:brightness-110"
              style={{ width: `${Math.max(item.value > 0 ? 2 : 0, (item.value / top) * 100)}%`, background: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
