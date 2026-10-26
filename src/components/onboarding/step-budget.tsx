'use client'

import type { BudgetData } from '@/lib/onboarding'
import { Chip, StepHeading, WhyWeAsk } from './wizard-ui'

export type { BudgetData }

interface StepBudgetProps {
  data: BudgetData
  onChange: (data: BudgetData) => void
}

const BUDGET_MIN = 5000
const BUDGET_MAX = 200000
const BUDGET_STEP = 1000

// Tapping a range sets a representative amount the couple can fine-tune.
const RANGES = [
  { label: 'Under $20k', min: BUDGET_MIN, max: 19999, preset: 15000 },
  { label: '$20–40k', min: 20000, max: 39999, preset: 30000 },
  { label: '$40–60k', min: 40000, max: 59999, preset: 50000 },
  { label: '$60k+', min: 60000, max: Infinity, preset: 75000 },
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function clamp(value: number) {
  return Math.max(BUDGET_MIN, Math.min(BUDGET_MAX, value))
}

export function StepBudget({ data, onChange }: StepBudgetProps) {
  const sliderPercent = ((data.totalBudget - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    onChange({ totalBudget: raw === '' ? BUDGET_MIN : clamp(parseInt(raw, 10)), unsure: false })
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeading title="What's your budget, roughly?" />

      <div
        className={`rounded-2xl border border-hairline bg-white px-5 pb-4 pt-5 transition-opacity ${data.unsure ? 'opacity-50' : ''}`}
      >
        <label htmlFor="budgetInput" className="sr-only">
          Total wedding budget in dollars
        </label>
        <div className="flex items-baseline font-display text-[2.6rem] font-bold leading-none tracking-[-0.05em] text-ink">
          <span aria-hidden>$</span>
          <input
            id="budgetInput"
            type="text"
            inputMode="numeric"
            className="w-full min-w-0 bg-transparent tabular-nums outline-none"
            value={data.totalBudget.toLocaleString('en-US')}
            onChange={handleInputChange}
          />
        </div>
        <input
          type="range"
          aria-label="Budget slider"
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          step={BUDGET_STEP}
          value={data.totalBudget}
          onChange={(e) => onChange({ totalBudget: parseInt(e.target.value, 10), unsure: false })}
          className="budget-range mt-4 w-full cursor-pointer appearance-none bg-transparent"
          style={{ '--slider-percent': `${sliderPercent}%` } as React.CSSProperties}
        />
        <div className="mt-1 flex justify-between text-xs text-ink-muted">
          <span>{formatCurrency(BUDGET_MIN)}</span>
          <span>{formatCurrency(BUDGET_MAX)}+</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {RANGES.map((range) => (
          <Chip
            key={range.label}
            selected={!data.unsure && data.totalBudget >= range.min && data.totalBudget <= range.max}
            onClick={() => onChange({ totalBudget: range.preset, unsure: false })}
          >
            {range.label}
          </Chip>
        ))}
        <Chip selected={data.unsure} onClick={() => onChange({ ...data, unsure: !data.unsure })}>
          Not sure yet
        </Chip>
      </div>

      <WhyWeAsk>
        so you can see what&apos;s left as you book vendors. Only you, and anyone you share your
        plan with, can see it.
      </WhyWeAsk>

      <style>{`
        .budget-range::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 9999px;
          background: linear-gradient(to right, var(--color-moss) 0%, var(--color-moss) var(--slider-percent), var(--color-hairline) var(--slider-percent), var(--color-hairline) 100%);
        }
        .budget-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid var(--color-moss);
          margin-top: -9px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
        }
        .budget-range::-moz-range-track { height: 6px; border-radius: 9999px; background: var(--color-hairline); }
        .budget-range::-moz-range-progress { height: 6px; border-radius: 9999px; background: var(--color-moss); }
        .budget-range::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid var(--color-moss);
        }
      `}</style>
    </div>
  )
}
