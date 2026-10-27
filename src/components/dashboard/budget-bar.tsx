import Link from 'next/link'

export interface CategorySpend {
  category: string
  amount: number
}

const SEGMENT_COLORS = ['bg-moss', 'bg-sage', 'bg-champagne', 'bg-moss-light/60']
const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

/**
 * Budget at a glance: what booked vendors commit them to, split by category,
 * against the total. "Paid" is what has actually gone out.
 */
export function BudgetBar({
  totalBudget,
  committed,
  paid,
}: {
  totalBudget: number
  committed: CategorySpend[]
  paid: number
}) {
  const committedTotal = committed.reduce((sum, c) => sum + c.amount, 0)
  const top = [...committed].sort((a, b) => b.amount - a.amount)
  const shown = top.slice(0, 3)
  const rest = top.slice(3).reduce((sum, c) => sum + c.amount, 0)
  const segments = rest > 0 ? [...shown, { category: 'Other', amount: rest }] : shown
  const scale = Math.max(totalBudget, committedTotal) || 1
  const left = totalBudget - committedTotal

  return (
    <section className="rounded-3xl border border-hairline bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">Budget</h2>
        {totalBudget > 0 ? (
          <p className="text-sm text-ink-muted">
            <b className="font-display text-base font-bold text-ink tabular-nums">{money(committedTotal)}</b> committed
            of {money(totalBudget)}
            {paid > 0 && (
              <>
                {' · '}
                <b className="font-semibold text-ink tabular-nums">{money(paid)}</b> paid
              </>
            )}
          </p>
        ) : (
          <Link href="/budget" className="text-sm font-semibold text-moss underline-offset-4 hover:underline">
            Set your budget →
          </Link>
        )}
      </div>

      <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full bg-ink/[0.07]">
        {segments.map((s, i) => (
          <i
            key={s.category}
            className={`block h-full ${SEGMENT_COLORS[i]}`}
            style={{ width: `${(s.amount / scale) * 100}%` }}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        {segments.length === 0 && <span>Book a vendor and it shows up here.</span>}
        {segments.map((s, i) => (
          <span key={s.category} className="inline-flex items-center gap-1.5">
            <i className={`inline-block size-2 rounded-[3px] ${SEGMENT_COLORS[i]}`} />
            {s.category} <span className="tabular-nums">{money(s.amount)}</span>
          </span>
        ))}
        {totalBudget > 0 && (
          <span className={`font-semibold tabular-nums ${left < 0 ? 'text-flag' : 'text-ink'}`}>
            {left < 0 ? `${money(-left)} over` : `${money(left)} left`}
          </span>
        )}
      </div>
    </section>
  )
}
