'use client'

import { useCheckout, useSubscription } from '@/lib/hooks/use-subscription'
import { PLANS } from '@/lib/stripe/config'

/** The pass card takes over the top of the dashboard for the trial's last days. */
export const TRIAL_CARD_DAYS = 4

/**
 * Shown on days 11–14 of the trial. Lists what the couple would lose, from
 * their own counts. Earlier in the trial the header chip is enough.
 */
export function DashboardUpgradeCard({ vendors, quotes }: { vendors: number; quotes: number }) {
  const checkout = useCheckout()
  const { access, isTrial, trialDaysLeft, isLoading } = useSubscription()
  const price = `$${PLANS.pass.price}`

  if (isLoading || !isTrial || trialDaysLeft > TRIAL_CARD_DAYS) return null

  const endDay = access?.trialEndsAt
    ? new Date(access.trialEndsAt).toLocaleDateString('en-US', { weekday: 'long' })
    : null
  const keep = [
    vendors > 0 ? `Your ${vendors} ${vendors === 1 ? 'vendor' : 'vendors'}${quotes > 0 ? ` and ${quotes} ${quotes === 1 ? 'quote' : 'quotes'}` : ''}` : 'Every vendor and quote you add',
    'Your plan, budget and deposit reminders',
    'Sharing with your partner',
  ]

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-moss p-5 text-[#F1EFE8] sm:flex-row sm:items-center sm:gap-8 sm:p-7">
      <div className="min-w-0 flex-1">
        <p className="font-display text-xl font-bold leading-tight tracking-[-0.03em]">
          Keep everything <span className="text-champagne">through your wedding.</span>
        </p>
        <p className="mt-1 text-sm text-[#C9D3C6]">
          {trialDaysLeft === 1 ? 'Your trial ends today' : `Your trial ends ${endDay ?? `in ${trialDaysLeft} days`}`}. After that
          Altared is locked until you get the pass. Nothing you added is deleted.
        </p>
        <ul className="mt-3 grid gap-1 text-sm">
          {keep.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-champagne" aria-hidden>✓</span>
              {line}
            </li>
          ))}
        </ul>
        {checkout.isError && (
          <p role="alert" className="mt-2 text-sm text-champagne">
            Checkout didn&apos;t open: {checkout.error.message}. Try again in a moment.
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:w-60">
        <button
          type="button"
          onClick={() => checkout.mutate({ location: 'dashboard_trial' })}
          disabled={checkout.isPending}
          className="rounded-full bg-champagne px-5 py-3 font-display text-sm font-bold text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {checkout.isPending ? 'Opening checkout…' : `Get the Wedding Pass · ${price}`}
        </button>
        <p className="text-center text-[11px] text-[#C9D3C6]">One payment. No subscription.</p>
      </div>
    </section>
  )
}
