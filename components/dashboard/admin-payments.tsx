"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, ArrowDownToLine, Clock, Landmark, Percent, PiggyBank, RefreshCw, Send, Users, Wallet } from "lucide-react"

import { useI18n } from "@/lib/i18n/context"
import { PLATFORM_COMMISSION_PERCENT, TEACHER_SHARE_PERCENT } from "@/lib/payments/fees"
import { localize } from "@/lib/mock-data"
import type { Balance, PayoutView, PendingPaymentView, PlatformRevenue } from "@/lib/payments/payouts"
import { resolvePaymentAction, reviewPayoutAction } from "@/lib/payments/actions"
import { DashboardShell, StatCard } from "@/components/dashboard/dashboard-shell"
import { adminNav } from "@/components/dashboard/admin-dashboard"
import { PayoutStatusBadge, RequestPayoutForm, usd } from "@/components/dashboard/teacher-payouts"
import { EmptyState, FormError, Panel, formatDateTime } from "@/components/lms/ui"
import { Button } from "@/components/ui/button"

type TeacherBalance = Balance & { id: string; name: string; email: string }

export function AdminPayments({
  payouts,
  pendingPayments,
  teachers,
  wallets,
  revenue,
  isOwner = false,
}: {
  isOwner?: boolean
  payouts: PayoutView[]
  pendingPayments: PendingPaymentView[]
  teachers: TeacherBalance[]
  wallets: { currency: string; balance: number }[]
  revenue: PlatformRevenue
}) {
  const { t, locale } = useI18n()
  const fr = locale === "fr"
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const open = payouts.filter((p) => p.kind !== "platform" && ["requested", "approved", "processing"].includes(p.status))
  const owed = teachers.reduce((sum, x) => sum + x.availableUsd + x.reservedUsd, 0)
  const feesCollected = payouts.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.feeUsd, 0)

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    start(async () => {
      const res = await action()
      if (!res.ok) setError(res.error ?? "Error")
      router.refresh()
    })
  }

  return (
    <DashboardShell nav={adminNav} titleKey="admin.payments">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={fr ? "Retraits à traiter" : "Payouts to process"} value={String(open.length)} icon={Clock} />
        <StatCard label={fr ? "Dû aux formateurs" : "Owed to teachers"} value={usd(owed)} icon={Users} />
        <StatCard label={fr ? "Frais de retrait perçus" : "Payout fees collected"} value={usd(feesCollected)} icon={Percent} />
        <StatCard label={fr ? "Paiements bloqués" : "Stuck payments"} value={String(pendingPayments.length)} icon={AlertTriangle} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel title={fr ? "Revenus de la plateforme" : "Platform revenue"} icon={PiggyBank}>
          <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <p className="text-sm text-muted-foreground">{fr ? "Disponible au retrait" : "Available to withdraw"}</p>
              <p className="mt-1 font-heading text-4xl font-bold tabular-nums">{usd(revenue.availableUsd)}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {fr
                  ? `100 % des cours créés par l'admin ou l'IA, ${PLATFORM_COMMISSION_PERCENT} % des cours des formateurs, certificats, cours Linko Academy et frais de retrait.`
                  : `100% of admin- and AI-created courses, ${PLATFORM_COMMISSION_PERCENT}% of teachers' courses, certificates, Linko Academy courses and payout fees.`}
              </p>
            </div>
            <dl className="space-y-2 text-sm">
              {[
                [fr ? "Ventes totales" : "Gross sales", revenue.grossSalesUsd, ""],
                [fr ? `Part des formateurs (${TEACHER_SHARE_PERCENT} %)` : `Teachers' share (${TEACHER_SHARE_PERCENT}%)`, -revenue.teacherEarningsUsd, ""],
                [fr ? "Revenus des cours (admin)" : "Course revenue (admin)", revenue.courseCommissionUsd, "text-success"],
                [fr ? "Certificats, modules IA, autres" : "Certificates, AI modules, other", revenue.otherSalesUsd, "text-success"],
                [fr ? "Frais de retrait formateurs" : "Teacher payout fees", revenue.payoutFeesUsd, "text-success"],
                [fr ? "Déjà retiré" : "Already withdrawn", -revenue.withdrawnUsd, ""],
              ].map(([label, value, tone]) => (
                <div key={label as string} className="flex justify-between gap-4 border-b border-border pb-2 last:border-0">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className={`tabular-nums font-medium ${tone}`}>
                    {(value as number) < 0 ? `−${usd(-(value as number))}` : usd(value as number)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Panel>
        {isOwner ? (
          <RequestPayoutForm available={revenue.availableUsd} mode="platform" />
        ) : (
          <Panel title={fr ? "Retirer les revenus" : "Withdraw revenue"} icon={Wallet}>
            <p className="text-sm text-muted-foreground">
              {fr
                ? "Les revenus de la plateforme sont versés uniquement sur le compte du propriétaire de la plateforme. Seul ce compte peut effectuer un retrait."
                : "Platform revenue is paid only to the platform owner's account. Only that account can make a withdrawal."}
            </p>
          </Panel>
        )}
      </div>

      <div className="mt-6">
        <FormError message={error} />
      </div>

      <Panel title={fr ? "Demandes de retrait" : "Payout requests"} icon={ArrowDownToLine} className="mt-4">
        {payouts.length === 0 ? (
          <EmptyState icon={Wallet} title={t("lms.empty")} />
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2 font-medium">{fr ? "Formateur" : "Teacher"}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("common.amount")}</th>
                  <th className="px-3 py-2 text-right font-medium">{fr ? "Frais" : "Fee"}</th>
                  <th className="px-3 py-2 text-right font-medium">{fr ? "À envoyer" : "To send"}</th>
                  <th className="px-3 py-2 font-medium">Mobile Money</th>
                  <th className="px-3 py-2 font-medium">{t("common.status")}</th>
                  <th className="px-5 py-2 text-right font-medium">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payouts.map((p) => (
                  <tr key={p.id} className="align-top">
                    <td className="px-5 py-3">
                      <p className="font-medium">
                        {p.teacherName}
                        {p.kind === "platform" && (
                          <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold">
                            {fr ? "Retrait admin" : "Admin withdrawal"}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(p.createdAt, locale)}</p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{usd(p.amountUsd)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                      {usd(p.feeUsd)} <span className="text-xs">({(p.feeRate * 100).toFixed(1)}%)</span>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                      {usd(p.netUsd)}
                      {p.amountLocal && p.currency && (
                        <p className="text-xs font-normal text-muted-foreground">
                          {p.amountLocal.toLocaleString(fr ? "fr-FR" : "en-GB")} {p.currency}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <p>
                        {p.method} · {p.country}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">{p.mobile}</p>
                    </td>
                    <td className="px-3 py-3">
                      <PayoutStatusBadge status={p.status} />
                      {p.providerReference && <p className="mt-1 font-mono text-[11px] text-muted-foreground">{p.providerReference}</p>}
                      {p.note && p.status !== "paid" && <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">{p.note}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {(p.status === "requested" || p.status === "approved") && (
                          <>
                            <Button
                              size="sm"
                              disabled={pending}
                              onClick={() => {
                                if (confirm(fr ? `Envoyer ${usd(p.netUsd)} à ${p.teacherName} via Swychr ?` : `Send ${usd(p.netUsd)} to ${p.teacherName} via Swychr?`))
                                  run(() => reviewPayoutAction({ id: p.id, decision: "send" }))
                              }}
                            >
                              <Send className="size-3.5" />
                              {fr ? "Envoyer via Swychr" : "Send via Swychr"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => {
                                const note = prompt(fr ? "Motif du refus :" : "Reason for rejection:")
                                if (note !== null) run(() => reviewPayoutAction({ id: p.id, decision: "reject", note }))
                              }}
                            >
                              {fr ? "Refuser" : "Reject"}
                            </Button>
                          </>
                        )}
                        {p.status === "processing" && (
                          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => reviewPayoutAction({ id: p.id, decision: "sync" }))}>
                            <RefreshCw className="size-3.5" />
                            {fr ? "Vérifier" : "Check status"}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          {fr
            ? "« Envoyer via Swychr » paie le montant net sur le Mobile Money du formateur, converti au taux du jour. Swychr prélève ses propres frais sur votre portefeuille. Un paiement échoué est recrédité au formateur."
            : "“Send via Swychr” pays the net amount to the teacher's Mobile Money, converted at today's rate. Swychr takes its own fee from your wallet. A failed payout is credited back to the teacher."}
        </p>
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title={fr ? "Portefeuilles Swychr" : "Swychr wallets"} icon={Landmark}>
          {wallets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{fr ? "Aucun portefeuille ou Swychr indisponible." : "No wallets, or Swychr unavailable."}</p>
          ) : (
            <ul className="divide-y divide-border">
              {wallets.map((w) => (
                <li key={w.currency} className="flex justify-between py-2 text-sm first:pt-0 last:pb-0">
                  <span className="text-muted-foreground">{w.currency}</span>
                  <span className="font-medium tabular-nums">{w.balance.toLocaleString(fr ? "fr-FR" : "en-GB")}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={fr ? "Soldes des formateurs" : "Teacher balances"} icon={Users}>
          {teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("lms.empty")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {teachers.map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-4 py-2.5 text-sm first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{x.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {fr ? "Gagné" : "Earned"} {usd(x.earnedUsd)} · {fr ? "versé" : "paid"} {usd(x.paidUsd)}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">{usd(x.availableUsd)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={fr ? "Paiements en attente de confirmation" : "Payments awaiting confirmation"} icon={AlertTriangle}>
          {pendingPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("lms.empty")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {pendingPayments.map((p) => (
                <li key={p.reference} className="flex flex-col gap-2 py-3 text-sm first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{localize(p.label, locale)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.customer} · {p.method} {p.phone} · {formatDateTime(p.date, locale)}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">{p.reference}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        if (confirm(fr ? "Confirmé dans les transactions Swychr ?" : "Confirmed in Swychr Transactions?"))
                          run(() => resolvePaymentAction({ reference: p.reference, outcome: "success" }))
                      }}
                    >
                      {fr ? "Valider" : "Confirm"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => resolvePaymentAction({ reference: p.reference, outcome: "failed" }))}>
                      {fr ? "Échec" : "Failed"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            {fr
              ? "Normalement confirmés automatiquement par Swychr. Ne validez qu'après vérification dans les transactions Swychr (ID = référence)."
              : "Normally confirmed automatically by Swychr. Only confirm after checking Swychr Transactions (transaction ID = reference)."}
          </p>
        </Panel>
      </div>
    </DashboardShell>
  )
}
