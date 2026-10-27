import Link from 'next/link'
import type { WeddingAnchor } from '@/lib/starter-plan'
import { dateEstimateLabel } from '@/lib/onboarding'

const DAY_MS = 24 * 60 * 60 * 1000

/** Days to the wedding, from the exact date or the season they estimated. */
export function Countdown({
  anchor,
  estimate,
  location,
}: {
  anchor: WeddingAnchor
  estimate: string | null
  location: string | null
}) {
  if (anchor.precision === 'none') {
    return (
      <div>
        <p className="font-display text-4xl font-bold leading-[0.95] tracking-[-0.055em] text-ink sm:text-5xl">
          Your wedding,
          <br />
          <span className="text-moss-light">in one place.</span>
        </p>
        <Link href="/settings" className="mt-3 inline-block text-sm font-semibold text-moss underline-offset-4 hover:underline">
          Add your wedding date for a countdown →
        </Link>
      </div>
    )
  }

  const days = Math.max(0, Math.ceil((anchor.date.getTime() - Date.now()) / DAY_MS))
  const exact = anchor.precision === 'exact'
  const dateLine = exact
    ? anchor.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : estimate
      ? dateEstimateLabel(estimate)
      : null

  return (
    <div>
      <p
        className={`font-display font-bold leading-[0.92] tracking-[-0.06em] text-ink sm:text-6xl ${
          exact ? 'text-[44px]' : 'text-[38px]'
        }`}
      >
        {days === 0 ? (
          <>It&apos;s the day.</>
        ) : (
          <>
            {exact ? '' : 'About '}
            {days.toLocaleString('en-US')} {days === 1 ? 'day' : 'days'}{' '}
            <span className="whitespace-nowrap text-moss-light">to go.</span>
          </>
        )}
      </p>
      <p className="mt-2 text-sm text-ink-muted">
        {dateLine}
        {location && <> · {location}</>}
        {!exact && (
          <>
            {' · '}
            <Link href="/settings" className="font-semibold text-moss underline-offset-4 hover:underline">
              Set the exact date
            </Link>
          </>
        )}
        {exact && !location && (
          <>
            {' · '}
            <Link href="/settings" className="font-semibold text-moss underline-offset-4 hover:underline">
              Add your venue or city
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
