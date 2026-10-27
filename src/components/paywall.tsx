'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCheckout, useSubscription } from '@/lib/hooks/use-subscription'
import { PLANS } from '@/lib/stripe/config'

export interface SavedPlanSummary {
  vendors: number
  quotes: number
  openTasks: number
  totalBudget: number
}

const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

/**
 * Shows the paywall instead of the app once the trial has ended. Settings stays
 * reachable so a locked couple can still manage or delete their account.
 *
 * The server decides the first render; after that the client's access wins, so
 * a couple coming back from Checkout is let in as soon as the webhook lands.
 */
export function AccessGate({
  serverLocked,
  summary,
  children,
}: {
  serverLocked: boolean
  summary: SavedPlanSummary | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const subscription = useSubscription()
  const { refetch } = subscription
  const justPaid = useSearchParams().get('pass') === 'active'
  const locked = subscription.data ? subscription.isLocked : serverLocked

  // The webhook that grants the pass can land a moment after the redirect
  useEffect(() => {
    if (!justPaid || !locked) return
    const timers = [1500, 4000, 8000, 15000].map((ms) => setTimeout(() => refetch(), ms))
    return () => timers.forEach(clearTimeout)
  }, [justPaid, locked, refetch])

  if (!locked || pathname.startsWith('/settings')) return <>{children}</>
  if (justPaid) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-center">
        <div>
          <div className="mx-auto size-8 animate-spin rounded-full border-4 border-moss border-t-transparent" />
          <p className="mt-4 font-display text-lg font-bold">Unlocking your plan…</p>
          <p className="mt-1 text-sm text-ink-muted">Payment received. This takes a few seconds.</p>
        </div>
      </div>
    )
  }
  return <Paywall summary={summary} />
}

export function Paywall({ summary }: { summary: SavedPlanSummary | null }) {
  const checkout = useCheckout()
  const pass = PLANS.pass

  const saved = summary
    ? [
        { label: summary.vendors === 1 ? 'vendor' : 'vendors', value: String(summary.vendors) },
        { label: summary.quotes === 1 ? 'quote' : 'quotes', value: String(summary.quotes) },
        { label: summary.openTasks === 1 ? 'open task' : 'open tasks', value: String(summary.openTasks) },
        ...(summary.totalBudget > 0 ? [{ label: 'budget', value: money(summary.totalBudget) }] : []),
      ]
    : []

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 py-6 sm:py-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">Your free trial has ended</p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-[1.02] tracking-[-0.05em] text-ink sm:text-5xl">
          Your plan is saved.
          <br />
          <span className="text-moss-light">Pick up where you left off.</span>
        </h1>
        <p className="mt-4 text-[16px] text-ink-muted">
          Get the Wedding Pass to keep using Altared. Everything you added is still here and comes back the
          moment you do.
        </p>
      </div>

      {saved.length > 0 && (
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {saved.map((item) => (
            <div key={item.label} className="rounded-2xl border border-hairline bg-white px-4 py-3">
              <dt className="sr-only">{item.label}</dt>
              <dd className="font-display text-2xl font-bold tracking-[-0.04em] text-ink tabular-nums">{item.value}</dd>
              <dd className="text-xs text-ink-muted">{item.label}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="rounded-3xl bg-moss p-6 text-[#F1EFE8] sm:p-7">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-display text-xl font-bold">{pass.name}</p>
          <p className="font-display text-3xl font-bold tracking-[-0.04em]">
            ${pass.price}
            <span className="ml-1.5 font-sans text-sm font-semibold tracking-normal text-[#C9D3C6]">once</span>
          </p>
        </div>
        <ul className="mt-4 grid gap-1.5 text-sm">
          {pass.features.map((f) => (
            <li key={f.text} className="flex gap-2">
              <span className="text-champagne" aria-hidden>✓</span>
              {f.text}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => checkout.mutate({ location: 'paywall' })}
          disabled={checkout.isPending}
          className="mt-6 w-full rounded-full bg-champagne px-5 py-3.5 font-display text-sm font-bold text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {checkout.isPending ? 'Opening checkout…' : `Get the Wedding Pass · $${pass.price}`}
        </button>
        {checkout.isError && (
          <p role="alert" className="mt-3 text-center text-sm text-champagne">
            Checkout didn&apos;t open: {checkout.error.message}. Try again in a moment.
          </p>
        )}
        <p className="mt-3 text-center text-xs text-[#C9D3C6]">
          One payment. No subscription. Lasts through your wedding.
        </p>
      </div>

      <p className="text-center text-sm text-ink-muted">
        <Link href="/settings" className="font-semibold text-ink underline-offset-4 hover:underline">
          Account settings
        </Link>
      </p>
    </div>
  )
}
