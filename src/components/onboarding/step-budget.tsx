'use client'

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface BudgetData {
  totalBudget: number
}

interface StepBudgetProps {
  data: BudgetData
  onChange: (data: BudgetData) => void
}

interface CategoryBreakdown {
  name: string
  percentage: number
  color: string
}

const BUDGET_CATEGORIES: CategoryBreakdown[] = [
  { name: 'Venue & Catering', percentage: 40, color: '#8B9F82' },
  { name: 'Photography & Video', percentage: 12, color: '#C9A96E' },
  { name: 'Music & Entertainment', percentage: 8, color: '#C4A0A0' },
  { name: 'Flowers & Decor', percentage: 10, color: '#A8C5A0' },
  { name: 'Attire & Beauty', percentage: 8, color: '#D4B896' },
  { name: 'Stationery & Invites', percentage: 3, color: '#B8A9C9' },
  { name: 'Transportation', percentage: 3, color: '#9BB5C9' },
  { name: 'Favors & Gifts', percentage: 3, color: '#C9B89B' },
  { name: 'Contingency', percentage: 8, color: '#7A7A7A' },
  { name: 'Other', percentage: 5, color: '#BFBFBF' },
]

const BUDGET_MIN = 5000
const BUDGET_MAX = 200000
const BUDGET_STEP = 1000

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function StepBudget({ data, onChange }: StepBudgetProps) {
  const categoryAmounts = useMemo(
    () =>
      BUDGET_CATEGORIES.map((cat) => ({
        ...cat,
        amount: Math.round((data.totalBudget * cat.percentage) / 100),
      })),
    [data.totalBudget]
  )

  function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ totalBudget: parseInt(e.target.value, 10) })
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    const value = raw === '' ? BUDGET_MIN : parseInt(raw, 10)
    onChange({ totalBudget: Math.max(BUDGET_MIN, Math.min(BUDGET_MAX, value)) })
  }

  // Calculate slider position as percentage for track fill
  const sliderPercent =
    ((data.totalBudget - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100

  return (
    <div className="space-y-8">
      {/* Section header */}
      <div className="text-center">
        <div
          className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(201, 169, 110, 0.15)' }}
        >
          <svg
            className="size-7"
            style={{ color: '#C9A96E' }}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
          Set your budget
        </h2>
        <p
          className="mt-2 text-sm"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#7A7A7A',
          }}
        >
          We&apos;ll suggest how to allocate your budget across categories
        </p>
      </div>

      {/* Budget input and slider */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="budgetInput"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: '#2D2D2D',
            }}
          >
            Total wedding budget
          </Label>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg font-medium"
              style={{ color: '#7A7A7A' }}
            >
              $
            </span>
            <Input
              id="budgetInput"
              type="text"
              inputMode="numeric"
              className="h-14 pl-8 text-center text-2xl font-semibold"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                borderColor: '#E5E2DD',
                color: '#2D2D2D',
              }}
              value={data.totalBudget.toLocaleString('en-US')}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Range slider */}
        <div className="space-y-2 px-1">
          <div className="relative">
            <input
              type="range"
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              step={BUDGET_STEP}
              value={data.totalBudget}
              onChange={handleSliderChange}
              className="w-full cursor-pointer appearance-none bg-transparent"
              style={
                {
                  '--slider-percent': `${sliderPercent}%`,
                } as React.CSSProperties
              }
            />
            <style>{`
              input[type='range']::-webkit-slider-runnable-track {
                height: 6px;
                border-radius: 9999px;
                background: linear-gradient(
                  to right,
                  #8B9F82 0%,
                  #8B9F82 var(--slider-percent),
                  #E5E2DD var(--slider-percent),
                  #E5E2DD 100%
                );
              }
              input[type='range']::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: #FFFFFF;
                border: 3px solid #8B9F82;
                margin-top: -8px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
                cursor: pointer;
              }
              input[type='range']::-moz-range-track {
                height: 6px;
                border-radius: 9999px;
                background: #E5E2DD;
              }
              input[type='range']::-moz-range-progress {
                height: 6px;
                border-radius: 9999px;
                background: #8B9F82;
              }
              input[type='range']::-moz-range-thumb {
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: #FFFFFF;
                border: 3px solid #8B9F82;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
                cursor: pointer;
              }
            `}</style>
          </div>
          <div className="flex justify-between text-xs" style={{ color: '#7A7A7A', fontFamily: "'DM Sans', sans-serif" }}>
            <span>{formatCurrency(BUDGET_MIN)}</span>
            <span>{formatCurrency(BUDGET_MAX)}+</span>
          </div>
        </div>
      </div>

      {/* Suggested category breakdowns */}
      <div className="space-y-4">
        <h3
          className="text-sm font-medium"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#2D2D2D',
          }}
        >
          Suggested budget breakdown
        </h3>

        <div className="space-y-3">
          {categoryAmounts.map((cat) => (
            <div key={cat.name} className="flex items-center gap-3">
              <div
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <div className="flex flex-1 items-center justify-between">
                <span
                  className="text-sm"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#2D2D2D',
                  }}
                >
                  {cat.name}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs tabular-nums"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      color: '#7A7A7A',
                    }}
                  >
                    {cat.percentage}%
                  </span>
                  <span
                    className="min-w-[80px] text-right text-sm font-medium tabular-nums"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      color: '#2D2D2D',
                    }}
                  >
                    {formatCurrency(cat.amount)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Visual bar breakdown */}
        <div className="flex h-3 overflow-hidden rounded-full">
          {categoryAmounts.map((cat) => (
            <div
              key={cat.name}
              className="transition-all duration-300"
              style={{
                width: `${cat.percentage}%`,
                backgroundColor: cat.color,
              }}
            />
          ))}
        </div>

        <p
          className="text-center text-xs"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#7A7A7A',
          }}
        >
          These are suggested allocations based on industry averages. You can customize them later.
        </p>
      </div>
    </div>
  )
}
