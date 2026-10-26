'use client'

import Link from 'next/link'
import { InfoIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Building blocks shared by the onboarding steps and both wizard pages.

export function StepHeading({ title, accent }: { title: string; accent?: string }) {
  return (
    <h2 className="font-display text-[1.75rem] font-bold leading-[1.05] tracking-[-0.045em] text-ink text-balance sm:text-[2.1rem]">
      {title}
      {accent && (
        <>
          <br />
          <span className="text-moss-light">{accent}</span>
        </>
      )}
    </h2>
  )
}

export function QuestionLabel({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} className="font-display text-base font-bold tracking-[-0.02em] text-ink">
      {children}
    </p>
  )
}

/** "Why we ask" note: every question says what its answer is used for. */
export function WhyWeAsk({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 rounded-xl bg-sage-soft px-3 py-2.5 text-[13px] leading-snug text-moss">
      <InfoIcon className="mt-px size-4 flex-none" aria-hidden />
      <span>
        <span className="font-semibold">Why we ask:</span> {children}
      </span>
    </p>
  )
}

interface ChipProps {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}

export function Chip({ selected, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'min-h-10 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2',
        selected
          ? 'border-moss bg-moss text-white'
          : 'border-hairline bg-white text-ink hover:border-moss/40'
      )}
    >
      {children}
    </button>
  )
}

interface SegmentedProps<T extends string> {
  label: string
  value: T | null
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid rounded-xl bg-ink/5 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'min-h-10 rounded-[9px] px-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss',
              selected ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn('font-display text-lg font-extrabold tracking-[-0.04em] text-ink', className)}
    >
      altared<span className="text-sage">.</span>
    </Link>
  )
}

interface WizardHeaderProps {
  step: number
  totalSteps: number
  onBack?: () => void
}

/** Wordmark or Back link, "Step X of N", and a segmented progress bar. */
export function WizardHeader({ step, totalSteps, onBack }: WizardHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex min-h-10 items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="-ml-1 flex min-h-10 items-center gap-1 px-1 text-sm font-semibold text-ink hover:text-moss"
          >
            <span aria-hidden>‹</span> Back
          </button>
        ) : (
          <Wordmark />
        )}
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
          Step {step} of {totalSteps}
        </span>
      </div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={step}
        aria-label={`Step ${step} of ${totalSteps}`}
      >
        {Array.from({ length: totalSteps }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-1 rounded-full transition-colors duration-300',
              i < step ? 'bg-moss' : 'bg-hairline'
            )}
          />
        ))}
      </div>
    </header>
  )
}

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export function PrimaryButton({ loading, children, className, disabled, ...props }: PrimaryButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-moss px-6 font-display text-[15px] font-bold tracking-[-0.01em] text-white transition-colors hover:bg-moss-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-moss/40',
        className
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

export function Spinner() {
  return (
    <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

/**
 * Page frame for the wizard. On phones the actions sit in a footer pinned to
 * the bottom of the screen so Continue is always in reach.
 */
export function WizardFrame({
  header,
  children,
  footer,
  below,
}: {
  header: React.ReactNode
  children: React.ReactNode
  footer: React.ReactNode
  below?: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pt-4 sm:pt-10">
        {header}
        <main className="flex flex-1 flex-col gap-6 pb-6 pt-7">{children}</main>
      </div>
      <div className="sticky bottom-0 border-t border-hairline bg-paper/95 backdrop-blur sm:static sm:border-0 sm:bg-transparent">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-2 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:pb-10">
          {footer}
          {below}
        </div>
      </div>
    </div>
  )
}

export function SkipButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-10 text-sm font-semibold text-ink-muted hover:text-ink"
    >
      Skip for now
    </button>
  )
}
