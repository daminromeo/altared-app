'use client'

import Link from 'next/link'
import { CalendarDays, AlertCircle, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/format'

export interface UpcomingPayment {
  id: string
  vendorName: string
  amount: number
  dueDate: string
  type: 'deposit' | 'final_payment'
}

interface UpcomingPaymentsProps {
  payments: UpcomingPayment[]
  loading?: boolean
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + 'T00:00:00')
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function UpcomingPayments({ payments, loading }: UpcomingPaymentsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-[#2D2D2D]">Upcoming Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-[#FAF8F5]" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-[#2D2D2D]">Upcoming Payments</CardTitle>
          {payments.length > 0 && (
            <Link
              href="/budget"
              className="text-xs font-medium text-[#8B9F82] hover:underline"
            >
              View budget
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CreditCard className="size-8 text-[#D1D5DB] mb-2" />
            <p className="text-sm text-[#7A7A7A]">No upcoming payments</p>
            <p className="text-xs text-[#7A7A7A] mt-0.5">
              Deposit due dates from booked vendors will show here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => {
              const days = daysUntil(payment.dueDate)
              const isOverdue = days < 0
              const isUrgent = days >= 0 && days <= 7

              return (
                <div
                  key={payment.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-3 py-2.5',
                    isOverdue
                      ? 'border-red-200 bg-red-50'
                      : isUrgent
                        ? 'border-[#C9A96E]/30 bg-[#C9A96E]/5'
                        : 'border-[#E8E4DF] bg-white'
                  )}
                >
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full',
                      isOverdue
                        ? 'bg-red-100'
                        : isUrgent
                          ? 'bg-[#C9A96E]/10'
                          : 'bg-[#8B9F82]/10'
                    )}
                  >
                    {isOverdue ? (
                      <AlertCircle className="size-4 text-red-600" />
                    ) : (
                      <CalendarDays
                        className={cn(
                          'size-4',
                          isUrgent ? 'text-[#C9A96E]' : 'text-[#8B9F82]'
                        )}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#2D2D2D] truncate">
                      {payment.vendorName}
                    </p>
                    <p className="text-xs text-[#7A7A7A]">
                      {payment.type === 'deposit' ? 'Deposit' : 'Final payment'} &middot;{' '}
                      {isOverdue ? (
                        <span className="text-red-600 font-medium">
                          {Math.abs(days)} day{Math.abs(days) !== 1 ? 's' : ''} overdue
                        </span>
                      ) : days === 0 ? (
                        <span className="text-[#C9A96E] font-medium">Due today</span>
                      ) : (
                        <span>{formatDate(payment.dueDate)}</span>
                      )}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-[#2D2D2D]">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
