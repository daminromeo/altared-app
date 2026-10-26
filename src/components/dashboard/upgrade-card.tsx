'use client'

import { useCheckout, useSubscription } from '@/lib/hooks/use-subscription'
import { PLANS } from '@/lib/stripe/config'

/**
 * Dashboard card for couples without paid access. During the free trial it
 * counts down; after the trial it reassures them their data is safe; for
 * accounts that never had a trial it names the most common reason to upgrade.
 */
export function DashboardUpgradeCard() {
  const checkout = useCheckout()
  const { access, isTrial, trialDaysLeft, trialEnded, hasPaidAccess, isLoading } = useSubscription()
  const price = `$${PLANS.pass.price}`

  if (isLoading || hasPaidAccess) return null

  let title: string
  let body: string
  if (isTrial) {
    const endDate = access?.trialEndsAt
      ? new Date(access.trialEndsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
      : null
    title =
      trialDaysLeft === 1 ? 'Last day of your free trial' : `${trialDaysLeft} days left in your free trial`
    body = `Everything is unlocked${endDate ? ` until ${endDate}` : ''}. To keep comparing 4 vendors, AI scanning and partner sharing after that, get the Wedding Pass for ${price}, once.`
  } else if (trialEnded) {
    title = 'Your free trial has ended'
    body = `Your vendors, quotes and budget are all still here. Get the Wedding Pass to unlock comparing 4 vendors, AI scanning and partner sharing again. ${price}, once.`
  } else {
    title = 'Comparing 3 or 4 vendors?'
    body = `The Wedding Pass compares up to 4 side by side, scans quotes with AI and lets your partner react. ${price}, once, through your wedding.`
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-moss p-5 text-[#F1EFE8] sm:flex-row sm:items-center sm:gap-6">
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-bold tracking-[-0.02em]">{title}</p>
        <p className="mt-1 text-sm text-[#C9D3C6]">{body}</p>
        {checkout.isError && (
          <p role="alert" className="mt-2 text-sm text-champagne">
            Checkout didn&apos;t open: {checkout.error.message}. Try again in a moment.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => checkout.mutate({ location: isTrial ? 'dashboard_trial' : 'dashboard_card' })}
        disabled={checkout.isPending}
        className="shrink-0 rounded-full bg-champagne px-5 py-2.5 font-display text-sm font-bold text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {checkout.isPending ? 'Opening checkout…' : `Get the Wedding Pass · ${price}`}
      </button>
    </div>
  )
}
