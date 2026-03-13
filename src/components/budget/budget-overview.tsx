'use client'

import { DollarSign, TrendingUp, CreditCard, Wallet, Receipt, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/format'

interface BudgetOverviewProps {
  totalBudget: number
  committed: number
  paid: number
}

export function BudgetOverview({
  totalBudget,
  committed,
  paid,
}: BudgetOverviewProps) {
  const remainingBudget = totalBudget - committed
  const isOverBudget = remainingBudget < 0
  const remainingPayments = committed - paid
  const progressPercent = totalBudget > 0 ? Math.min((committed / totalBudget) * 100, 100) : 0

  const stats = [
    {
      label: 'Total Budget',
      value: formatCurrency(totalBudget),
      icon: Wallet,
      iconBg: 'bg-[#8B9F82]/10',
      iconColor: 'text-[#8B9F82]',
    },
    {
      label: 'Estimated Total',
      value: formatCurrency(committed),
      icon: TrendingUp,
      iconBg: 'bg-[#C9A96E]/10',
      iconColor: 'text-[#C9A96E]',
      tooltip: 'Sum of all estimated costs from your budget items',
    },
    {
      label: 'Paid',
      value: formatCurrency(paid),
      icon: CreditCard,
      iconBg: 'bg-[#047857]/10',
      iconColor: 'text-[#047857]',
    },
    {
      label: 'Remaining Payments',
      value: formatCurrency(Math.max(0, remainingPayments)),
      icon: Receipt,
      iconBg: 'bg-[#C4A0A0]/10',
      iconColor: 'text-[#C4A0A0]',
      tooltip: 'Estimated total minus what you\'ve already paid',
    },
    {
      label: 'Remaining Budget',
      value: formatCurrency(Math.abs(remainingBudget)),
      icon: DollarSign,
      iconBg: isOverBudget ? 'bg-red-100' : 'bg-[#8B9F82]/10',
      iconColor: isOverBudget ? 'text-red-600' : 'text-[#8B9F82]',
      valueColor: isOverBudget ? 'text-red-600' : 'text-[#8B9F82]',
      prefix: isOverBudget ? '-' : '',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex size-10 items-center justify-center rounded-lg',
                      stat.iconBg
                    )}
                  >
                    <Icon className={cn('size-5', stat.iconColor)} />
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-xs font-medium text-[#7A7A7A]">
                      {stat.label}
                      {'tooltip' in stat && stat.tooltip && (
                        <span className="group relative">
                          <Info className="size-3 text-[#C9A96E]/60 cursor-help" />
                          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-[#2D2D2D] px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                            {stat.tooltip}
                          </span>
                        </span>
                      )}
                    </p>
                    <p
                      className={cn(
                        'text-lg font-bold tabular-nums',
                        stat.valueColor ?? 'text-[#2D2D2D]'
                      )}
                    >
                      {stat.prefix}
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#2D2D2D]">Budget Usage</p>
          <p className="text-sm tabular-nums text-[#7A7A7A]">
            {formatCurrency(committed)} / {formatCurrency(totalBudget)}
          </p>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[#FAF8F5]">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700 ease-out',
              isOverBudget ? 'bg-red-500' : 'bg-[#8B9F82]'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between">
          <p className="text-xs text-[#7A7A7A]">0%</p>
          <p
            className={cn(
              'text-xs font-medium',
              isOverBudget ? 'text-red-600' : 'text-[#8B9F82]'
            )}
          >
            {progressPercent.toFixed(1)}% used
          </p>
          <p className="text-xs text-[#7A7A7A]">100%</p>
        </div>
      </div>
    </div>
  )
}
