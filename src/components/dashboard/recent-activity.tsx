'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import {
  Users,
  DollarSign,
  FileText,
  MessageSquare,
  CalendarCheck,
  Star,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/empty-state'
import type { LucideIcon } from 'lucide-react'

type ActivityType =
  | 'vendor_added'
  | 'vendor_contacted'
  | 'vendor_booked'
  | 'payment_made'
  | 'proposal_received'
  | 'message_sent'
  | 'task_completed'
  | 'review_added'

interface Activity {
  id: string
  type: ActivityType
  description: string
  created_at: string
  link?: string
}

interface RecentActivityProps {
  activities: Activity[]
  loading?: boolean
}

const activityConfig: Record<
  ActivityType,
  { icon: LucideIcon; color: string; bgColor: string }
> = {
  vendor_added: {
    icon: Users,
    color: 'text-[#8B9F82]',
    bgColor: 'bg-[#8B9F82]/10',
  },
  vendor_contacted: {
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  vendor_booked: {
    icon: CalendarCheck,
    color: 'text-[#8B9F82]',
    bgColor: 'bg-[#8B9F82]/10',
  },
  payment_made: {
    icon: DollarSign,
    color: 'text-[#C9A96E]',
    bgColor: 'bg-[#C9A96E]/10',
  },
  proposal_received: {
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  message_sent: {
    icon: MessageSquare,
    color: 'text-[#C4A0A0]',
    bgColor: 'bg-[#C4A0A0]/10',
  },
  task_completed: {
    icon: CalendarCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  review_added: {
    icon: Star,
    color: 'text-[#C9A96E]',
    bgColor: 'bg-[#C9A96E]/10',
  },
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <Card className="bg-white p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-36 rounded bg-[#FAF8F5]" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="size-8 shrink-0 rounded-lg bg-[#FAF8F5]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-52 rounded bg-[#FAF8F5]" />
                <div className="h-3 w-16 rounded bg-[#FAF8F5]" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className="bg-white">
        <EmptyState
          icon={Clock}
          title="No recent activity"
          description="Your activity feed will show actions across your wedding planning."
        />
      </Card>
    )
  }

  return (
    <Card className="bg-white p-4">
      <h2
        className="mb-4 text-base font-semibold text-[#2D2D2D]"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Recent Activity
      </h2>

      <div className="space-y-1">
        {activities.map((activity) => {
          const config = activityConfig[activity.type] || activityConfig.vendor_added
          const Icon = config.icon

          const content = (
            <div
              className={cn(
                'flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors',
                activity.link && 'hover:bg-[#FAF8F5] cursor-pointer'
              )}
            >
              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg',
                  config.bgColor
                )}
              >
                <Icon className={cn('size-4', config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#2D2D2D]">{activity.description}</p>
                <p className="mt-0.5 text-xs text-[#7A7A7A]">
                  {formatTimestamp(activity.created_at)}
                </p>
              </div>
            </div>
          )

          if (activity.link) {
            return (
              <Link key={activity.id} href={activity.link}>
                {content}
              </Link>
            )
          }

          return <div key={activity.id}>{content}</div>
        })}
      </div>
    </Card>
  )
}
