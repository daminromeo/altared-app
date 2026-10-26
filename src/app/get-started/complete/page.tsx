'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { trackEvent } from '@/lib/analytics'
import { clearDraft, loadDraft, saveOnboardingToProfile } from '@/lib/onboarding'

/**
 * This page handles saving onboarding data after Google OAuth sign-in.
 * The get-started flow stores onboarding data in sessionStorage before
 * redirecting to Google. After the OAuth callback, the user lands here
 * to save that data to their profile.
 */
export default function GetStartedCompletePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function saveAndRedirect() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/get-started')
        return
      }

      const draft = loadDraft()

      // Funnel: Google/OAuth signups complete here (the email path fires its
      // own signup_completed in the wizard). TikTok's CompleteRegistration is
      // already sent server-side in the auth callback, so GA only here.
      trackEvent('signup_completed', { method: 'google', from: draft?.from ?? 'direct' })

      if (draft) {
        const saveError = await saveOnboardingToProfile(supabase, user, draft)
        if (saveError) console.error('Onboarding save failed:', saveError.message)
        clearDraft()
      }

      router.push('/dashboard')
    }

    saveAndRedirect()
  }, [supabase, router])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper">
      <div className="text-center">
        <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-4 border-moss border-t-transparent" />
        <p className="text-sm text-ink-muted">Saving your plan…</p>
      </div>
    </div>
  )
}
