import Link from 'next/link'

export interface NextUpItem {
  id: string
  title: string
  detail: string
  href: string
  /** ISO date; compare prompts have none */
  date: string | null
  kind: 'payment' | 'task' | 'plan' | 'compare'
  dueSoon?: boolean
}

function DateChip({ date, kind }: { date: string | null; kind: NextUpItem['kind'] }) {
  if (kind === 'compare' || !date) {
    return (
      <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-champagne-soft font-display text-lg font-bold text-ink" aria-hidden>
        ⇄
      </span>
    )
  }
  const d = new Date(date)
  return (
    <span className="w-11 flex-none rounded-xl bg-sage-soft py-1 text-center text-[10px] font-bold uppercase leading-tight text-moss">
      {d.toLocaleDateString('en-US', { month: 'short' })}
      <span className="block font-display text-base">{d.getDate()}</span>
    </span>
  )
}

/** Payments, quotes to compare and tasks, merged into one short list. */
export function NextUp({ items }: { items: NextUpItem[] }) {
  return (
    <section className="rounded-3xl border border-hairline bg-white px-5 pb-2 pt-5 sm:px-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">Next up</h2>
        <Link href="/tasks" className="text-xs font-semibold text-moss hover:underline">
          All tasks
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-sm text-ink-muted">Nothing due soon. Add a quote or a task and it lands here.</p>
      ) : (
        <ul className="mt-1 divide-y divide-hairline">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="flex items-center gap-3 py-3 transition-opacity hover:opacity-80">
                <DateChip date={item.date} kind={item.kind} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{item.title}</span>
                  <span className="block truncate text-xs text-ink-muted">{item.detail}</span>
                </span>
                {item.dueSoon && (
                  <span className="rounded-full bg-flag-soft px-2 py-0.5 text-[10.5px] font-bold text-flag">Due soon</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
