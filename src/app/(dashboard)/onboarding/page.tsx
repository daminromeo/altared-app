'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  DEFAULT_DRAFT,
  saveOnboardingToProfile,
  type OnboardingDraft,
  type WeddingBasicsData,
  type BudgetData,
  type VendorCategoriesData,
} from '@/lib/onboarding'
import {
  StepWeddingDetails,
  isWeddingDetailsAnswered,
} from '@/components/onboarding/step-wedding-details'
import { StepBudget } from '@/components/onboarding/step-budget'
import { StepVendorCategories } from '@/components/onboarding/step-vendor-categories'
import {
  PrimaryButton,
  SkipButton,
  WizardFrame,
  WizardHeader,
} from '@/components/onboarding/wizard-ui'

// Signed-in users who created an account on /signup (not the get-started
// wizard) land here to answer the same three planning questions.
const TOTAL_STEPS = 3

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [draft, setDraft] = useState<OnboardingDraft>(DEFAULT_DRAFT)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const step = draft.step

  const setBasics = useCallback(
    (basics: WeddingBasicsData) => setDraft((d) => ({ ...d, basics })),
    []
  )
  const setBudget = useCallback((budget: BudgetData) => setDraft((d) => ({ ...d, budget })), [])
  const setCategories = useCallback(
    (categories: VendorCategoriesData) => setDraft((d) => ({ ...d, categories })),
    []
  )

  function canProceed(): boolean {
    if (step === 1) return isWeddingDetailsAnswered(draft.basics)
    if (step === 3) return draft.categories.selectedCategories.length >= 1
    return true
  }

  function goNext({ skipped = false } = {}) {
    setDraft((d) => ({
      ...d,
      step: d.step + 1,
      budget: d.step === 2 && skipped ? { ...d.budget, unsure: true } : d.budget,
    }))
    window.scrollTo({ top: 0 })
  }

  async function handleComplete() {
    setIsSubmitting(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Your session ended. Log in again to save your plan.')
        return
      }

      // Profile row already exists (created by the signup trigger)
      const saveError = await saveOnboardingToProfile(supabase, user, draft)
      if (saveError) {
        setError(`We couldn't save your plan: ${saveError.message}`)
        return
      }

      router.push('/dashboard')
    } catch {
      setError("We couldn't reach Altared. Your answers are still here. Check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <WizardFrame
      header={
        <WizardHeader
          step={step}
          totalSteps={TOTAL_STEPS}
          onBack={step > 1 ? () => setDraft((d) => ({ ...d, step: d.step - 1 })) : undefined}
        />
      }
      footer={
        step < TOTAL_STEPS ? (
          <>
            <PrimaryButton onClick={() => goNext()} disabled={!canProceed()}>
              Continue
            </PrimaryButton>
            <SkipButton onClick={() => goNext({ skipped: true })} />
          </>
        ) : (
          <PrimaryButton onClick={handleComplete} loading={isSubmitting} disabled={!canProceed()}>
            {isSubmitting
              ? 'Saving…'
              : `Finish · ${draft.categories.selectedCategories.length} selected`}
          </PrimaryButton>
        )
      }
    >
      {step === 1 && <StepWeddingDetails data={draft.basics} onChange={setBasics} />}
      {step === 2 && <StepBudget data={draft.budget} onChange={setBudget} />}
      {step === 3 && <StepVendorCategories data={draft.categories} onChange={setCategories} />}
      {error && (
        <p role="alert" className="rounded-xl bg-error-soft px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}
    </WizardFrame>
  )
}
