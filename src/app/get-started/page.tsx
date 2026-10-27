'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { trackEvent } from '@/lib/analytics'
import { TRIAL_DAYS } from '@/lib/stripe/config'
import {
  DEFAULT_DRAFT,
  STEP_NAMES,
  loadDraft,
  saveDraft,
  clearDraft,
  sanitizeFrom,
  summarizeDraft,
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
  Spinner,
  StepHeading,
  WizardFrame,
  WizardHeader,
  Wordmark,
} from '@/components/onboarding/wizard-ui'

const TOTAL_STEPS = 4

const signupSchema = z.object({
  email: z.string().email('Enter an email address like name@example.com.'),
  password: z.string().min(8),
})

interface FieldErrors {
  email?: string
  password?: string
  /** Show a "Log in instead" link under the email field */
  accountExists?: boolean
}

/**
 * Maps a Supabase auth error to a message that says what happened and what to
 * do next, attached to the field it concerns when there is one.
 */
function describeAuthError(err: { code?: string; message: string; status?: number }): {
  fields: FieldErrors
  banner: string | null
} {
  const code = err.code ?? ''
  if (code === 'user_already_exists' || code === 'email_exists' || /already registered/i.test(err.message)) {
    return {
      fields: { email: 'This email already has an account.', accountExists: true },
      banner: null,
    }
  }
  if (code === 'weak_password' || /password/i.test(err.message)) {
    return {
      fields: { password: `${err.message.replace(/\.$/, '')}. Try a longer password.` },
      banner: null,
    }
  }
  if (code === 'email_address_invalid' || code === 'validation_failed') {
    return {
      fields: { email: "That email address doesn't look right. Check it and try again." },
      banner: null,
    }
  }
  if (err.status === 429 || /rate limit/i.test(err.message)) {
    return {
      fields: {},
      banner: 'Too many sign-up attempts from this connection. Wait a minute, then try again.',
    }
  }
  return { fields: {}, banner: `We couldn't create your account: ${err.message}` }
}

const NETWORK_ERROR =
  "We couldn't reach Altared. Your answers are still here. Check your connection and try again."

export default function GetStartedPage() {
  const supabase = useMemo(() => createClient(), [])

  const [draft, setDraft] = useState<OnboardingDraft>(DEFAULT_DRAFT)
  const [hydrated, setHydrated] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [emailConfirmation, setEmailConfirmation] = useState<string | null>(null)

  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const step = draft.step

  // Restore answers from this browser session (refresh, failed signup, back
  // from the login page), then fire the top-of-funnel event.
  useEffect(() => {
    const fromParam = sanitizeFrom(new URLSearchParams(window.location.search).get('from'))
    const restored = loadDraft() ?? DEFAULT_DRAFT
    const from = fromParam ?? restored.from
    // sessionStorage is only readable after mount
    setDraft({ ...restored, from })
    setHydrated(true)
    trackEvent('onboarding_started', { from })
  }, [])

  useEffect(() => {
    if (hydrated) saveDraft(draft)
  }, [draft, hydrated])

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
    if (step >= TOTAL_STEPS) return

    const params: Record<string, string | number | boolean> = {
      step,
      step_name: STEP_NAMES[step - 1],
      from: draft.from,
    }
    if (step === 1) {
      params.date_precision = skipped ? 'none' : (draft.basics.datePrecision ?? 'none')
      params.skipped = skipped
    }
    if (step === 2) params.skipped = skipped || draft.budget.unsure
    trackEvent('onboarding_step_completed', params)

    setDraft((d) => ({
      ...d,
      step: d.step + 1,
      budget: step === 2 && skipped ? { ...d.budget, unsure: true } : d.budget,
    }))
    window.scrollTo({ top: 0 })
  }

  function goPrev() {
    if (step > 1) setDraft((d) => ({ ...d, step: d.step - 1 }))
  }

  async function onSubmitSignup() {
    const result = signupSchema.safeParse({ email: signupEmail, password: signupPassword })
    if (!result.success) {
      const errors: FieldErrors = {}
      for (const issue of result.error.issues) {
        if (issue.path[0] === 'email') errors.email = issue.message
        if (issue.path[0] === 'password') {
          errors.password = `Use at least 8 characters. You have ${signupPassword.length}.`
        }
      }
      setFieldErrors(errors)
      trackEvent('signup_failed', { method: 'email', reason: 'validation' })
      return
    }

    setFieldErrors({})
    setBanner(null)
    setIsSubmitting(true)
    trackEvent('signup_submitted', { method: 'email' })

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: { emailRedirectTo: `${window.location.origin}/callback?onboarding=true` },
      })

      if (error) {
        const described = describeAuthError(error)
        setFieldErrors(described.fields)
        setBanner(described.banner)
        trackEvent('signup_failed', { method: 'email', reason: error.code ?? error.message })
        return
      }

      // With email confirmation on, Supabase answers an existing address with
      // a user that has no identities instead of an error.
      if (data.user && data.user.identities?.length === 0) {
        setFieldErrors({ email: 'This email already has an account.', accountExists: true })
        trackEvent('signup_failed', { method: 'email', reason: 'user_already_exists' })
        return
      }

      if (data.session && data.user) {
        const saveError = await saveOnboardingToProfile(supabase, data.user, draft)
        if (saveError) console.error('Onboarding save failed:', saveError.message)
        trackEvent(
          'signup_completed',
          { method: 'email', from: draft.from },
          { event: 'CompleteRegistration' }
        )
        clearDraft()
        window.location.href = '/get-started/connect'
        return
      }

      // No session means email confirmation is required. The draft stays in
      // sessionStorage for /get-started/complete.
      trackEvent('signup_email_confirmation_required', { method: 'email' })
      setEmailConfirmation(signupEmail)
    } catch (err) {
      console.error('Signup error:', err)
      trackEvent('signup_failed', { method: 'email', reason: 'exception' })
      setBanner(NETWORK_ERROR)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true)
    setBanner(null)
    trackEvent('signup_submitted', { method: 'google' })
    saveDraft(draft)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/callback?onboarding=true` },
      })
      if (error) {
        trackEvent('signup_failed', { method: 'google', reason: error.message })
        setBanner(`Google sign-in didn't start: ${error.message}. Try again, or use your email.`)
        setIsGoogleLoading(false)
      }
    } catch {
      trackEvent('signup_failed', { method: 'google', reason: 'exception' })
      setBanner(NETWORK_ERROR)
      setIsGoogleLoading(false)
    }
  }

  if (emailConfirmation) {
    return <CheckYourEmail email={emailConfirmation} />
  }

  const loginLink = (
    <p className="text-center text-sm text-ink-muted">
      Already have an account?{' '}
      <Link href="/login" className="font-semibold text-moss underline underline-offset-4">
        Log in
      </Link>
    </p>
  )

  let footer: React.ReactNode
  if (step < TOTAL_STEPS) {
    footer = (
      <>
        <PrimaryButton onClick={() => goNext()} disabled={!canProceed()}>
          {step === 3
            ? `Continue · ${draft.categories.selectedCategories.length} selected`
            : 'Continue'}
        </PrimaryButton>
        {step < 3 && <SkipButton onClick={() => goNext({ skipped: true })} />}
      </>
    )
  } else {
    footer = (
      <>
        <PrimaryButton onClick={onSubmitSignup} loading={isSubmitting}>
          {isSubmitting ? 'Saving your plan…' : 'Save my plan'}
        </PrimaryButton>
        <p className="text-center text-xs text-ink-muted">
          Free, with every feature unlocked for {TRIAL_DAYS} days. No card needed.
        </p>
      </>
    )
  }

  return (
    <WizardFrame
      header={
        <WizardHeader step={step} totalSteps={TOTAL_STEPS} onBack={step > 1 ? goPrev : undefined} />
      }
      footer={footer}
      below={step === 1 || step === 4 ? loginLink : undefined}
    >
      {step === 1 && <StepWeddingDetails data={draft.basics} onChange={setBasics} />}
      {step === 2 && <StepBudget data={draft.budget} onChange={setBudget} />}
      {step === 3 && <StepVendorCategories data={draft.categories} onChange={setCategories} />}
      {step === 4 && (
        <StepCreateAccount
          draft={draft}
          banner={banner}
          fieldErrors={fieldErrors}
          email={signupEmail}
          password={signupPassword}
          onEmailChange={(v) => {
            setSignupEmail(v)
            if (fieldErrors.email) setFieldErrors((e) => ({ ...e, email: undefined, accountExists: false }))
          }}
          onPasswordChange={(v) => {
            setSignupPassword(v)
            if (fieldErrors.password && v.length >= 8) setFieldErrors((e) => ({ ...e, password: undefined }))
          }}
          onSubmit={onSubmitSignup}
          isGoogleLoading={isGoogleLoading}
          onGoogleSignIn={handleGoogleSignIn}
        />
      )}
    </WizardFrame>
  )
}

// ── Step 4: Create Account ──────────────────────────────────────────────────

interface StepCreateAccountProps {
  draft: OnboardingDraft
  banner: string | null
  fieldErrors: FieldErrors
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: () => void
  isGoogleLoading: boolean
  onGoogleSignIn: () => void
}

function StepCreateAccount({
  draft,
  banner,
  fieldErrors,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  isGoogleLoading,
  onGoogleSignIn,
}: StepCreateAccountProps) {
  const summary = summarizeDraft(draft)
  const inputClass =
    'min-h-12 w-full rounded-xl border bg-white px-4 text-[15px] text-ink outline-none transition-shadow placeholder:text-ink-muted/70 focus:border-moss focus:ring-2 focus:ring-moss/20'

  return (
    <div className="flex flex-col gap-5">
      <StepHeading title="Your plan is ready." accent="Save it to keep going." />

      <dl className="grid grid-cols-2 gap-2">
        {[
          { label: 'Wedding', value: summary.when },
          { label: 'Guests', value: summary.guests },
          { label: 'Budget', value: summary.budget },
          { label: 'To find', value: summary.vendors },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-hairline bg-white px-3 py-2.5">
            <dt className="text-[11px] text-ink-muted">{item.label}</dt>
            <dd className="font-display text-[15px] font-bold tracking-[-0.02em] text-ink">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      {banner && (
        <p role="alert" className="rounded-xl bg-error-soft px-4 py-3 text-sm text-error">
          {banner}
        </p>
      )}

      <button
        type="button"
        onClick={onGoogleSignIn}
        disabled={isGoogleLoading}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-hairline bg-white text-[15px] font-semibold text-ink transition-colors hover:border-moss/40 disabled:opacity-60"
      >
        {isGoogleLoading ? <Spinner /> : <GoogleIcon />}
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-hairline" />
        or with email
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-semibold text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={`${inputClass} ${fieldErrors.email ? 'border-error ring-2 ring-error-soft' : 'border-hairline'}`}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
          />
          {fieldErrors.email && (
            <p id="email-error" className="text-[13px] text-error">
              {fieldErrors.email}{' '}
              {fieldErrors.accountExists && (
                <Link href="/login" className="font-semibold underline underline-offset-2">
                  Log in instead
                </Link>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-semibold text-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={`${inputClass} ${fieldErrors.password ? 'border-error ring-2 ring-error-soft' : 'border-hairline'}`}
            aria-invalid={!!fieldErrors.password}
            aria-describedby="password-help"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
          />
          <p
            id="password-help"
            className={`text-[13px] ${fieldErrors.password ? 'text-error' : 'text-ink-muted'}`}
          >
            {fieldErrors.password ?? 'At least 8 characters.'}
          </p>
        </div>
        {/* Lets Enter submit; the visible button lives in the pinned footer */}
        <button type="submit" className="sr-only" tabIndex={-1}>
          Save my plan
        </button>
      </form>

      <p className="text-center text-xs leading-relaxed text-ink-muted">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="underline underline-offset-4">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}

function CheckYourEmail({ email }: { email: string }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper px-5 py-10 text-ink">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Wordmark />
        <StepHeading title="Check your email." accent="Then you're in." />
        <p className="text-[15px] leading-relaxed text-ink-muted">
          We sent a confirmation link to <span className="font-semibold text-ink">{email}</span>.
          Open it on this device to finish setting up your plan.
        </p>
        <div className="rounded-2xl border border-hairline bg-white p-4 text-sm text-ink-muted">
          <p className="font-semibold text-ink">Don&apos;t see it?</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Check your spam or junk folder.</li>
            <li>Make sure the address above is right.</li>
          </ul>
        </div>
        <Link href="/login" className="text-sm font-semibold text-moss underline underline-offset-4">
          Go to log in
        </Link>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
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
  )
}
