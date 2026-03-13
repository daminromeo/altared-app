'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const TOTAL_STEPS = 4

const STEP_LABELS = ['Wedding Details', 'Budget', 'Vendor Categories', 'Create Account']

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must include uppercase, lowercase, and a number'
    ),
})

export default function GetStartedPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [emailConfirmation, setEmailConfirmation] = useState<string | null>(null)

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

  // Step 4 form
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, { message?: string }>>({})

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
    if (currentStep === 2) return budgetData.totalBudget >= 5000
    if (currentStep === 3) return vendorCategories.selectedCategories.length >= 1
    if (currentStep === 4) return true
    return false
  }

  function goNext() {
    if (currentStep < TOTAL_STEPS) setCurrentStep((s) => s + 1)
  }

  function goPrev() {
    if (currentStep > 1) setCurrentStep((s) => s - 1)
  }

  async function saveOnboardingData(userId: string) {
    await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: signupEmail,
          full_name: weddingDetails.yourName,
          partner_name: weddingDetails.partnerName,
          wedding_date: weddingDetails.weddingDate
            ? weddingDetails.weddingDate.toISOString().split('T')[0]
            : null,
          wedding_location: weddingDetails.location || null,
          estimated_guest_count:
            weddingDetails.guestCount === '' ? null : Number(weddingDetails.guestCount),
          wedding_name: weddingDetails.weddingName || null,
          total_budget: budgetData.totalBudget,
          onboarding_completed: true,
          subscription_status: 'free',
        },
        { onConflict: 'id' }
      )
  }

  async function onSubmitSignup() {
    // Validate manually
    const result = signupSchema.safeParse({ email: signupEmail, password: signupPassword })
    if (!result.success) {
      const fieldErrors: Record<string, { message?: string }> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string
        if (!fieldErrors[field]) {
          fieldErrors[field] = { message: issue.message }
        }
      }
      setFormErrors(fieldErrors)
      return
    }
    setFormErrors({})
    setIsSubmitting(true)
    setError(null)

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: weddingDetails.yourName,
          },
          emailRedirectTo: `${window.location.origin}/callback?onboarding=true`,
        },
      })

      if (signUpError) {
        setError(
          signUpError.message === 'User already registered'
            ? 'An account with this email already exists. Please sign in instead.'
            : signUpError.message
        )
        return
      }

      if (signUpData.session && signUpData.user) {
        // Small delay to let the handle_new_user trigger create the profile row
        await new Promise((r) => setTimeout(r, 300))
        await saveOnboardingData(signUpData.user.id)
        window.location.href = '/dashboard'
        return
      }

      // No session means email confirmation is required
      sessionStorage.setItem(
        'onboarding_data',
        JSON.stringify({ weddingDetails, budgetData, vendorCategories })
      )
      setEmailConfirmation(signupEmail)
    } catch (err) {
      console.error('Signup error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true)
    setError(null)

    // Store onboarding data in sessionStorage so we can save it after OAuth redirect
    sessionStorage.setItem(
      'onboarding_data',
      JSON.stringify({ weddingDetails, budgetData, vendorCategories })
    )

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback?onboarding=true`,
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setIsGoogleLoading(false)
    }
  }

  const progressPercent = (currentStep / TOTAL_STEPS) * 100

  // ── Email confirmation screen ─────────────────────────────────────────────
  if (emailConfirmation) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center px-4 py-8"
        style={{ backgroundColor: '#FAF8F5' }}
      >
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

        <div className="relative z-10 w-full max-w-md text-center">
          <div
            className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(139, 159, 130, 0.15)' }}
          >
            <svg
              className="size-8"
              style={{ color: '#8B9F82' }}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>

          <h1
            className="text-3xl tracking-tight"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#2D2D2D',
            }}
          >
            Check your email
          </h1>
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: '#7A7A7A',
            }}
          >
            We&apos;ve sent a confirmation link to{' '}
            <span className="font-semibold" style={{ color: '#2D2D2D' }}>
              {emailConfirmation}
            </span>
            . Click the link to activate your account and access your wedding dashboard.
          </p>

          <div
            className="mt-8 rounded-xl border p-4 text-left text-sm"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              borderColor: '#E8E4DF',
              backgroundColor: '#FFFFFF',
              color: '#7A7A7A',
            }}
          >
            <p className="font-medium" style={{ color: '#2D2D2D' }}>
              Don&apos;t see the email?
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
            </ul>
          </div>

          <div className="mt-6">
            <Link
              href="/login"
              className="text-sm font-medium underline underline-offset-4 transition-colors hover:opacity-80"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: '#8B9F82',
              }}
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

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
          <Link href="/">
            <h1
              className="text-3xl tracking-tight"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: '#2D2D2D',
              }}
            >
              Altared
            </h1>
          </Link>
          <p
            className="mt-1 text-sm"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: '#7A7A7A',
            }}
          >
            Let&apos;s plan your perfect wedding
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
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
                  <div
                    className="flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      backgroundColor: isActive || isCompleted ? '#8B9F82' : '#E5E2DD',
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
            {/* Step 1: Wedding Details */}
            {currentStep === 1 && (
              <StepWeddingDetails
                data={weddingDetails}
                onChange={handleWeddingDetailsChange}
              />
            )}

            {/* Step 2: Budget */}
            {currentStep === 2 && (
              <StepBudget data={budgetData} onChange={handleBudgetChange} />
            )}

            {/* Step 3: Vendor Categories */}
            {currentStep === 3 && (
              <StepVendorCategories
                data={vendorCategories}
                onChange={handleVendorCategoriesChange}
              />
            )}

            {/* Step 4: Create Account */}
            {currentStep === 4 && (
              <StepCreateAccount
                weddingName={weddingDetails.yourName}
                error={error}
                formErrors={formErrors}
                email={signupEmail}
                password={signupPassword}
                onEmailChange={setSignupEmail}
                onPasswordChange={setSignupPassword}
                isLoading={isSubmitting}
                isGoogleLoading={isGoogleLoading}
                onGoogleSignIn={handleGoogleSignIn}
              />
            )}

            {/* Error message (for steps 1-3) */}
            {currentStep < 4 && error && (
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

              {currentStep < 4 ? (
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
                  onClick={onSubmitSignup}
                  disabled={isSubmitting}
                  className="min-w-[140px]"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    backgroundColor: !isSubmitting ? '#8B9F82' : '#C8CFC5',
                    color: '#FFFFFF',
                  }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <LoadingSpinner />
                      Creating...
                    </span>
                  ) : (
                    'Create account'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Already have an account */}
        <div className="mt-4 text-center">
          <p
            className="text-xs"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: '#7A7A7A',
            }}
          >
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium underline underline-offset-4 transition-colors hover:opacity-80"
              style={{ color: '#8B9F82' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Step 4: Create Account ──────────────────────────────────────────────────

interface StepCreateAccountProps {
  weddingName: string
  error: string | null
  formErrors: Record<string, { message?: string }>
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  isLoading: boolean
  isGoogleLoading: boolean
  onGoogleSignIn: () => void
}

function StepCreateAccount({
  weddingName,
  error,
  formErrors,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  isLoading,
  isGoogleLoading,
  onGoogleSignIn,
}: StepCreateAccountProps) {
  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="text-center">
        <div
          className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(139, 159, 130, 0.15)' }}
        >
          <svg
            className="size-7"
            style={{ color: '#8B9F82' }}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <h2
          className="text-2xl"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: '#2D2D2D',
          }}
        >
          Create your account
        </h2>
        <p
          className="mt-2 text-sm"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#7A7A7A',
          }}
        >
          {weddingName
            ? `Almost there, ${weddingName}! Save your wedding plans with a free account.`
            : 'Save your wedding plans with a free account.'}
        </p>
      </div>

      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full gap-2"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          borderColor: '#E5E2DD',
        }}
        onClick={onGoogleSignIn}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <LoadingSpinner />
        ) : (
          <svg className="size-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Continue with Google
      </Button>

      {/* Divider */}
      <div className="relative flex items-center">
        <div className="flex-1 border-t" style={{ borderColor: '#E5E2DD' }} />
        <span
          className="px-4 text-xs uppercase"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#7A7A7A',
          }}
        >
          or
        </span>
        <div className="flex-1 border-t" style={{ borderColor: '#E5E2DD' }} />
      </div>

      {/* Email/Password form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="email"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: '#2D2D2D',
            }}
          >
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="h-10"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              borderColor: formErrors.email ? undefined : '#E5E2DD',
            }}
            aria-invalid={!!formErrors.email}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
          />
          {formErrors.email && (
            <p className="text-xs text-destructive" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {formErrors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="password"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: '#2D2D2D',
            }}
          >
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a strong password"
            autoComplete="new-password"
            className="h-10"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              borderColor: formErrors.password ? undefined : '#E5E2DD',
            }}
            aria-invalid={!!formErrors.password}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
          />
          {formErrors.password && (
            <p className="text-xs text-destructive" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {formErrors.password.message}
            </p>
          )}
          <p
            className="text-xs"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: '#7A7A7A',
            }}
          >
            Must be 8+ characters with uppercase, lowercase, and a number
          </p>
        </div>

        {error && (
          <div
            className="rounded-lg border px-4 py-3 text-sm"
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
      </div>

      {/* Terms */}
      <p
        className="text-center text-xs leading-relaxed"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          color: '#7A7A7A',
        }}
      >
        By creating an account, you agree to our{' '}
        <span className="underline underline-offset-4">Terms of Service</span> and{' '}
        <span className="underline underline-offset-4">Privacy Policy</span>.
      </p>
    </div>
  )
}

// ── Loading Spinner ─────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
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
  )
}
