'use client'

import { useCheckout, useSubscription } from '@/lib/hooks/use-subscription'

/** Days left in the trial plus a quiet link to buy, for the sidebar. */
export function TrialStatus() {
  const { isTrial, trialDaysLeft, isLoading } = useSubscription()
  const checkout = useCheckout()
  if (isLoading || !isTrial) return null

  const urgent = trialDaysLeft <= 3
  return (
    <div className="flex flex-col items-start gap-2">
      <TrialChip daysLeft={trialDaysLeft} urgent={urgent} />
      <button
        type="button"
        onClick={() => checkout.mutate({ location: 'sidebar' })}
        disabled={checkout.isPending}
        className="text-left text-[13px] font-bold text-moss hover:underline disabled:opacity-60"
      >
        {checkout.isPending ? 'Opening checkout…' : 'Get the Wedding Pass →'}
      </button>
    </div>
  )
}

export function TrialChip({ daysLeft, urgent = false }: { daysLeft: number; urgent?: boolean }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${
        urgent ? 'bg-flag-soft text-flag' : 'bg-sage-soft text-moss'
      }`}
    >
      {daysLeft === 1 ? 'Trial · last day' : `Trial · ${daysLeft} days left`}
    </span>
  )
}
