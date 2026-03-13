'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  StepWeddingDetails,
  type WeddingDetailsData,
} from '@/components/onboarding/step-wedding-details'
import { StepBudget, type BudgetData } from '@/components/onboarding/step-budget'
import {
  StepVendorCategories,
  type VendorCategoriesData,
} from '@/components/onboarding/step-vendor-categories'

const TOTAL_STEPS = 3

const STEP_LABELS = ['Wedding Details', 'Budget', 'Vendor Categories']

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 state
  const [weddingDetails, setWeddingDetails] = useState<WeddingDetailsData>({
    yourName: '',
    partnerName: '',
    weddingName: '',
    weddingDate: undefined,
    location: '',
    guestCount: '',
  })

  // Step 2 state
  const [budgetData, setBudgetData] = useState<BudgetData>({
    totalBudget: 30000,
  })

  // Step 3 state
  const [vendorCategories, setVendorCategories] = useState<VendorCategoriesData>({
    selectedCategories: ['venue', 'photographer', 'caterer', 'florist'],
  })

  const handleWeddingDetailsChange = useCallback(
    (data: WeddingDetailsData) => setWeddingDetails(data),
    []
  )

  const handleBudgetChange = useCallback(
    (data: BudgetData) => setBudgetData(data),
    []
  )

  const handleVendorCategoriesChange = useCallback(
    (data: VendorCategoriesData) => setVendorCategories(data),
    []
  )

  function canProceed(): boolean {
    if (currentStep === 1) {
      return (
        weddingDetails.yourName.trim().length >= 1 &&
        weddingDetails.partnerName.trim().length >= 1
      )
    }
    if (currentStep === 2) {
      return budgetData.totalBudget >= 5000
    }
    if (currentStep === 3) {
      return vendorCategories.selectedCategories.length >= 1
    }
    return false
  }

  function goNext() {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1)
    }
  }

  function goPrev() {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1)
    }
  }

  async function handleComplete() {
    setIsSubmitting(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to complete onboarding.')
        setIsSubmitting(false)
        return
      }

      // Update profile with onboarding data (profile already created by signup trigger)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: weddingDetails.yourName,
          partner_name: weddingDetails.partnerName,
          wedding_name: weddingDetails.weddingName || null,
          wedding_date: weddingDetails.weddingDate
            ? weddingDetails.weddingDate.toISOString().split('T')[0]
            : null,
          wedding_location: weddingDetails.location || null,
          estimated_guest_count:
            weddingDetails.guestCount === '' ? null : Number(weddingDetails.guestCount),
          total_budget: budgetData.totalBudget,
          onboarding_completed: true,
        })
        .eq('id', user.id)

      if (profileError) {
        setError(profileError.message)
        setIsSubmitting(false)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  const progressPercent = (currentStep / TOTAL_STEPS) * 100

  return (
    <div
      className="flex min-h-screen flex-col items-center px-4 py-8"
      style={{ backgroundColor: '#FAF8F5' }}
    >
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full opacity-15 blur-3xl"
          style={{ backgroundColor: '#8B9F82' }}
        />
        <div
          className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full opacity-15 blur-3xl"
          style={{ backgroundColor: '#C9A96E' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1
            className="text-3xl tracking-tight"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#2D2D2D',
            }}
          >
            Altared
          </h1>
          <p
            className="mt-1 text-sm"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: '#7A7A7A',
            }}
          >
            Let&apos;s get you set up
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          {/* Step labels */}
          <div className="mb-3 flex justify-between">
            {STEP_LABELS.map((label, index) => {
              const stepNum = index + 1
              const isActive = stepNum === currentStep
              const isCompleted = stepNum < currentStep

              return (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5"
                  style={{ flex: 1 }}
                >
                  {/* Step number circle */}
                  <div
                    className="flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      backgroundColor: isActive
                        ? '#8B9F82'
                        : isCompleted
                          ? '#8B9F82'
                          : '#E5E2DD',
                      color: isActive || isCompleted ? '#FFFFFF' : '#7A7A7A',
                    }}
                  >
                    {isCompleted ? (
                      <svg
                        className="size-4"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span
                    className="text-center text-xs"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      color: isActive ? '#2D2D2D' : '#7A7A7A',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Progress track */}
          <div
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: '#E5E2DD' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: '#8B9F82',
              }}
            />
          </div>
        </div>

        {/* Step content card */}
        <Card className="border-0 shadow-lg" style={{ backgroundColor: '#FFFFFF' }}>
          <CardContent className="p-6 sm:p-8">
            {/* Step 1 */}
            {currentStep === 1 && (
              <StepWeddingDetails
                data={weddingDetails}
                onChange={handleWeddingDetailsChange}
              />
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <StepBudget data={budgetData} onChange={handleBudgetChange} />
            )}

            {/* Step 3 */}
            {currentStep === 3 && (
              <StepVendorCategories
                data={vendorCategories}
                onChange={handleVendorCategoriesChange}
              />
            )}

            {/* Error message */}
            {error && (
              <div
                className="mt-6 rounded-lg border px-4 py-3 text-sm"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  backgroundColor: '#FEF2F2',
                  borderColor: '#FECACA',
                  color: '#DC2626',
                }}
              >
                {error}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-8 flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={goPrev}
                disabled={currentStep === 1}
                className="min-w-[100px]"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  borderColor: '#E5E2DD',
                  opacity: currentStep === 1 ? 0.4 : 1,
                }}
              >
                Back
              </Button>

              {currentStep < TOTAL_STEPS ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="min-w-[100px]"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    backgroundColor: canProceed() ? '#8B9F82' : '#C8CFC5',
                    color: '#FFFFFF',
                  }}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  onClick={handleComplete}
                  disabled={!canProceed() || isSubmitting}
                  className="min-w-[140px]"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    backgroundColor:
                      canProceed() && !isSubmitting ? '#8B9F82' : '#C8CFC5',
                    color: '#FFFFFF',
                  }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="size-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Complete setup'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skip onboarding */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="text-xs underline underline-offset-4 transition-colors hover:opacity-80"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: '#7A7A7A',
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
