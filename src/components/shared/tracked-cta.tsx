'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { trackEvent } from '@/lib/analytics'

type TrackedCTAProps = ComponentProps<typeof Link> & {
  /** Where on the page this CTA lives, e.g. "hero_primary", "sticky_mobile". */
  location: string
}

/**
 * A next/link that fires a `cta_click` funnel event before navigating.
 * Drop-in replacement for <Link> on conversion CTAs.
 */
export function TrackedCTA({ location, onClick, ...props }: TrackedCTAProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackEvent('cta_click', { location, href: String(props.href) })
        onClick?.(e)
      }}
    />
  )
}
