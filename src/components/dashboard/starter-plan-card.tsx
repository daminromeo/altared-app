'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

export interface PlanTask {
  id: string
  title: string
  due_date: string
  completed: boolean
}

const VISIBLE = 5

function monthLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString('en-US', { month: 'long', ...(sameYear ? {} : { year: 'numeric' }) })
}

/**
 * The starter plan's open tasks grouped by month, with progress. Offers to add
 * the plan when there isn't one (older accounts, or after clearing it).
 */
export function StarterPlanCard({
  tasks,
  onToggle,
  onAdd,
  onClear,
}: {
  tasks: PlanTask[]
  onToggle: (id: string, completed: boolean) => void
  onAdd: () => Promise<void>
  onClear: () => Promise<void>
}) {
  const [adding, setAdding] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const done = tasks.filter((t) => t.completed).length
  const open = tasks.filter((t) => !t.completed)

  if (open.length === 0) {
    return (
      <section className="rounded-3xl border border-hairline bg-white p-5 sm:p-6">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">Your plan</h2>
        <p className="mt-3 font-display text-lg font-bold tracking-[-0.02em] text-ink">
          {tasks.length > 0 ? 'Every plan task is done.' : 'Want a starter plan?'}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {tasks.length > 0
            ? 'Nice work. Add your own tasks any time.'
            : "We'll add a planning timeline to your tasks, from booking the venue to final payments, dated from your wedding."}
        </p>
        {tasks.length === 0 && (
          <button
            type="button"
            disabled={adding}
            onClick={async () => {
              setAdding(true)
              try {
                await onAdd()
              } finally {
                setAdding(false)
              }
            }}
            className="mt-4 rounded-full bg-moss px-4 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-moss-light disabled:opacity-60"
          >
            {adding ? 'Adding…' : 'Add a starter plan'}
          </button>
        )}
      </section>
    )
  }

  const visible = open.slice(0, VISIBLE)
  const groups: { month: string; tasks: PlanTask[] }[] = []
  for (const task of visible) {
    const month = monthLabel(task.due_date)
    const last = groups[groups.length - 1]
    if (last?.month === month) last.tasks.push(task)
    else groups.push({ month, tasks: [task] })
  }
  const soon = Date.now() + 14 * 24 * 60 * 60 * 1000

  return (
    <section className="rounded-3xl border border-hairline bg-white px-5 pb-4 pt-5 sm:px-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">Your plan</h2>
        <span className="text-xs text-ink-muted tabular-nums">
          {done} of {tasks.length} done
        </span>
      </div>

      {groups.map((group) => (
        <div key={group.month}>
          <p className="pb-1 pt-3 text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-muted">{group.month}</p>
          <ul>
            {group.tasks.map((task) => (
              <li key={task.id} className="flex items-center gap-3 py-1.5">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(e) => onToggle(task.id, e.target.checked)}
                  aria-label={`Mark "${task.title}" done`}
                  className="size-[18px] flex-none cursor-pointer rounded-md border-sage accent-moss"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{task.title}</span>
                <span
                  className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                    new Date(task.due_date).getTime() < soon ? 'bg-flag-soft text-flag' : 'bg-ink/[0.05] text-ink-muted'
                  }`}
                >
                  {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-xs">
        <Link href="/tasks" className="font-semibold text-moss hover:underline">
          {open.length > VISIBLE ? `See all ${open.length} →` : 'Open tasks →'}
        </Link>
        <button type="button" onClick={() => setConfirmOpen(true)} className="text-ink-muted hover:text-ink">
          Clear plan
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Clear the starter plan?"
        description={`This removes the ${open.length} open plan ${open.length === 1 ? 'task' : 'tasks'} from your tasks. Tasks you added yourself and ones you've ticked off stay. You can add the plan back from here.`}
        confirmLabel="Clear plan"
        variant="destructive"
        onConfirm={onClear}
      />
    </section>
  )
}
