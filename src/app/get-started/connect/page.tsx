'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { trackEvent } from '@/lib/analytics'
import { useTextConnection } from '@/lib/hooks/use-text-connection'
import { ConnectPhoneEmbed, PhoneConnected } from '@/components/texting/connect-phone'
import { PrimaryButton, SkipButton, StepHeading, WizardFrame, Wordmark } from '@/components/onboarding/wizard-ui'

const EXAMPLES = ['What’s due this week?', 'Paid the florist $500 deposit', 'A photo of a vendor quote']

/**
 * Right after signup: connect a phone to the planner. The account already
 * exists, so this is never in the way of signing up, and skipping is one tap.
 */
export default function ConnectPhonePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { connected } = useTextConnection({ watch: true })
  const reported = useRef(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/login')
    })
    trackEvent('texting_connect_viewed', { location: 'onboarding' })
  }, [supabase, router])

  useEffect(() => {
    if (connected && !reported.current) {
      reported.current = true
      trackEvent('texting_connected', { location: 'onboarding' })
    }
  }, [connected])

  function goToDashboard(skipped: boolean) {
    if (skipped) trackEvent('texting_connect_skipped', { location: 'onboarding' })
    router.push('/dashboard')
  }

  return (
    <WizardFrame
      header={
        <header className="flex min-h-10 items-center">
          <Wordmark />
        </header>
      }
      footer={
        connected ? (
          <PrimaryButton onClick={() => goToDashboard(false)}>Go to my dashboard</PrimaryButton>
        ) : (
          <SkipButton onClick={() => goToDashboard(true)} />
        )
      }
    >
      <StepHeading title="Your plan is saved." accent="Now text your planner." />
      <p className="text-[15px] leading-relaxed text-ink-muted">
        Connect your phone and you can update your plan by text, like texting a friend who&apos;s helping
        you plan. It works with iMessage and Android texting. No app to download.
      </p>

      <ul className="flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <li key={example} className="rounded-full bg-[#0A84FF] px-3 py-1.5 text-[13px] text-white">
            {example}
          </li>
        ))}
      </ul>

      {connected ? (
        <PhoneConnected />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <ConnectPhoneEmbed />
          <p className="text-center text-xs text-ink-muted">
            Send the text that opens. This page updates as soon as it arrives.
          </p>
        </div>
      )}
    </WizardFrame>
  )
}
