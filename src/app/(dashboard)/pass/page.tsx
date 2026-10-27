'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCheckout, useSubscription } from '@/lib/hooks/use-subscription'

/**
 * Link target for "Get the Wedding Pass" in emails: opens Checkout straight
 * away. Locked accounts see the paywall here instead (the layout's gate).
 */
export default function PassPage() {
  const location = (useSearchParams().get('from') ?? 'pass_link').replace(/[^a-z0-9_]/gi, '').slice(0, 40)
  const { data, hasPaidAccess } = useSubscription()
  const checkout = useCheckout()
  const started = useRef(false)

  useEffect(() => {
    if (!data || hasPaidAccess || started.current) return
    started.current = true
    checkout.mutate({ location })
  }, [data, hasPaidAccess, checkout, location])

  if (hasPaidAccess) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-lg font-bold">You already have the Wedding Pass.</p>
        <Link href="/dashboard" className="mt-3 inline-block text-sm font-semibold text-moss hover:underline">
          Go to your dashboard →
        </Link>
      </div>
    )
  }

  return (
    <div className="py-20 text-center">
      {checkout.isError ? (
        <>
          <p className="font-display text-lg font-bold">Checkout didn&apos;t open.</p>
          <p className="mt-1 text-sm text-ink-muted">{checkout.error.message}</p>
          <button
            type="button"
            onClick={() => checkout.mutate({ location })}
            className="mt-4 rounded-full bg-moss px-5 py-2.5 font-display text-sm font-bold text-white"
          >
            Try again
          </button>
        </>
      ) : (
        <>
          <div className="mx-auto size-8 animate-spin rounded-full border-4 border-moss border-t-transparent" />
          <p className="mt-4 font-display text-lg font-bold">Opening secure checkout…</p>
        </>
      )}
    </div>
  )
}
