'use client'

import {
  DollarSign,
  Users,
  CalendarHeart,
  FileText,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsData {
  totalBudget: number
  spentBudget: number
  vendorsContacted: number
  vendorsBooked: number
  weddingDate: string | null
  proposalCount: number
}

interface StatsCardsProps {
  data: StatsData
  loading?: boolean
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getDaysUntilWedding(dateStr: string | null): number | null {
  if (!dateStr) return null
  const wedding = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  wedding.setHours(0, 0, 0, 0)
  const diff = wedding.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

const stats = [
  {
    key: 'budget' as const,
    label: 'Total Budget',
    icon: DollarSign,
    color: 'text-[#8B9F82]',
    bgColor: 'bg-[#8B9F82]/10',
  },
  {
    key: 'vendors' as const,
    label: 'Vendors',
    icon: Users,
    color: 'text-[#C9A96E]',
    bgColor: 'bg-[#C9A96E]/10',
  },
  {
    key: 'countdown' as const,
    label: 'Days Until Wedding',
    icon: CalendarHeart,
    color: 'text-[#C4A0A0]',
    bgColor: 'bg-[#C4A0A0]/10',
  },
  {
    key: 'proposals' as const,
    label: 'Proposals',
    icon: FileText,
    color: 'text-[#8B9F82]',
    bgColor: 'bg-[#8B9F82]/10',
  },
]

export function StatsCards({ data, loading }: StatsCardsProps) {
  const daysUntil = getDaysUntilWedding(data.weddingDate)

  function getValue(key: string): string {
    switch (key) {
      case 'budget':
        return formatCurrency(data.totalBudget)
      case 'vendors':
        return `${data.vendorsBooked}`
      case 'countdown':
        return daysUntil !== null ? `${daysUntil}` : '--'
      case 'proposals':
        return `${data.proposalCount}`
      default:
        return '--'
    }
  }

  function getSubtext(key: string): string {
    switch (key) {
      case 'budget':
        return `${formatCurrency(data.spentBudget)} spent / ${formatCurrency(data.totalBudget - data.spentBudget)} remaining`
      case 'vendors':
        return `${data.vendorsContacted} contacted / ${data.vendorsBooked} booked`
      case 'countdown':
        return data.weddingDate
          ? new Date(data.weddingDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Set your wedding date'
      case 'proposals':
        return 'Uploaded & scanned'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.key} className="bg-white">
            <CardContent className="pt-1">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-24 rounded bg-[#FAF8F5]" />
                <div className="h-8 w-16 rounded bg-[#FAF8F5]" />
                <div className="h-3 w-32 rounded bg-[#FAF8F5]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.key} className="bg-white">
            <CardContent className="pt-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#7A7A7A]">
                  {stat.label}
                </p>
                <div
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg',
                    stat.bgColor
                  )}
                >
                  <Icon className={cn('size-5', stat.color)} />
                </div>
              </div>
              <div className="mt-2">
                <p
                  className="text-2xl font-bold text-[#2D2D2D]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {getValue(stat.key)}
                </p>
                <p className="mt-1 text-xs text-[#7A7A7A]">
                  {getSubtext(stat.key)}
                </p>
                {stat.key === 'budget' && data.totalBudget > 0 && (
                  <div className="mt-2.5">
                    <div className="h-2 w-full rounded-full bg-[#E5E7EB]">
                      <div
                        className="h-2 rounded-full bg-[#8B9F82] transition-all duration-500"
                        style={{ width: `${Math.min(100, (data.spentBudget / data.totalBudget) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-[#7A7A7A]">
                      {Math.round((data.spentBudget / data.totalBudget) * 100)}% of budget used
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
