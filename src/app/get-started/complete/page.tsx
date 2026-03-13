'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

      // Read onboarding data from sessionStorage
      const raw = sessionStorage.getItem('onboarding_data')
      if (raw) {
        try {
          const { weddingDetails, budgetData } = JSON.parse(raw)

          // Try update first (profile may exist from trigger)
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: weddingDetails.yourName || null,
              partner_name: weddingDetails.partnerName || null,
              wedding_date: weddingDetails.weddingDate
                ? new Date(weddingDetails.weddingDate).toISOString().split('T')[0]
                : null,
              wedding_location: weddingDetails.location || null,
              estimated_guest_count:
                weddingDetails.guestCount === '' ? null : Number(weddingDetails.guestCount),
              total_budget: budgetData.totalBudget,
              onboarding_completed: true,
            })
            .eq('id', user.id)

          // If update failed (no profile row), insert
          if (updateError) {
            await supabase.from('profiles').insert({
              id: user.id,
              email: user.email ?? '',
              full_name: weddingDetails.yourName || null,
              partner_name: weddingDetails.partnerName || null,
              wedding_date: weddingDetails.weddingDate
                ? new Date(weddingDetails.weddingDate).toISOString().split('T')[0]
                : null,
              wedding_location: weddingDetails.location || null,
              estimated_guest_count:
                weddingDetails.guestCount === '' ? null : Number(weddingDetails.guestCount),
              total_budget: budgetData.totalBudget,
              onboarding_completed: true,
              subscription_status: 'free',
            })
          }

          sessionStorage.removeItem('onboarding_data')
        } catch {
          // JSON parse failed — just continue to dashboard
        }
      }

      router.push('/dashboard')
    }

    saveAndRedirect()
  }, [supabase, router])

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: '#FAF8F5' }}
    >
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#8B9F82] border-t-transparent" />
        <p
          className="text-sm"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#7A7A7A',
          }}
        >
          Setting up your account...
        </p>
      </div>
    </div>
  )
}
