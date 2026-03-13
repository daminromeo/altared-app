'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, CalendarDays, Plus, ArrowRight, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/shared/empty-state'
import { getVendorEmoji } from '@/lib/vendor-icons'

interface Task {
  id: string
  title: string
  due_date: string
  type: 'payment' | 'meeting' | 'deadline' | 'follow_up' | 'other'
  completed: boolean
  vendor?: {
    name: string
    category_name?: string | null
    category_icon?: string | null
  } | null
}

interface UpcomingTasksProps {
  tasks: Task[]
  loading?: boolean
  onTaskToggle?: (taskId: string, completed: boolean) => void
}

const typeBadgeStyles: Record<string, string> = {
  payment: 'bg-[#C9A96E]/10 text-[#C9A96E]',
  meeting: 'bg-purple-50 text-purple-700',
  deadline: 'bg-red-50 text-red-700',
  follow_up: 'bg-blue-50 text-blue-700',
  other: 'bg-gray-100 text-gray-700',
}

function toLocalDateStr(dateStr: string): string {
  if (dateStr.includes('T')) return dateStr.split('T')[0]
  return dateStr.slice(0, 10)
}

function dateDiffDays(dateStr: string): number {
  const parts = toLocalDateStr(dateStr).split('-').map(Number)
  const dueDateMs = Date.UTC(parts[0], parts[1] - 1, parts[2])
  const now = new Date()
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((dueDateMs - todayMs) / (1000 * 60 * 60 * 24))
}

function formatDueDate(dateStr: string): string {
  const diffDays = dateDiffDays(dateStr)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
  if (diffDays <= 7) return `In ${diffDays} days`

  const parts = toLocalDateStr(dateStr).split('-').map(Number)
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function isOverdue(dateStr: string): boolean {
  return dateDiffDays(dateStr) < 0
}

export function UpcomingTasks({
  tasks,
  loading,
  onTaskToggle,
}: UpcomingTasksProps) {
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set())
  const supabase = useMemo(() => createClient(), [])

  const handleToggle = async (task: Task) => {
    const newCompleted = !task.completed
    setCompletingIds((prev) => new Set(prev).add(task.id))

    try {
      await supabase
        .from('reminders')
        .update({ is_completed: newCompleted })
        .eq('id', task.id)

      onTaskToggle?.(task.id, newCompleted)
    } catch (err) {
      // Silently handle error - UI will reflect current state
    } finally {
      setCompletingIds((prev) => {
        const next = new Set(prev)
        next.delete(task.id)
        return next
      })
    }
  }

  if (loading) {
    return (
      <Card className="bg-white p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-36 rounded bg-[#FAF8F5]" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="size-5 rounded-full bg-[#FAF8F5]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-48 rounded bg-[#FAF8F5]" />
                <div className="h-3 w-24 rounded bg-[#FAF8F5]" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card className="bg-white">
        <EmptyState
          icon={CalendarDays}
          title="No upcoming tasks"
          description="You're all caught up! Tasks and reminders will appear here."
          actionLabel="New Task"
          actionHref="/tasks"
        />
      </Card>
    )
  }

  return (
    <Card className="bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-base font-semibold text-[#2D2D2D]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Upcoming Tasks
        </h2>
        <Link
          href="/tasks"
          className="flex items-center gap-1 text-xs font-medium text-[#8B9F82] hover:text-[#7A8E71] transition-colors"
        >
          View all
          <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="space-y-1">
        {tasks.map((task) => {
          const overdue = isOverdue(task.due_date) && !task.completed
          const completing = completingIds.has(task.id)

          return (
            <div
              key={task.id}
              className={cn(
                'flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[#FAF8F5]',
                task.completed && 'opacity-50'
              )}
            >
              <button
                onClick={() => handleToggle(task)}
                disabled={completing}
                className="shrink-0 text-[#7A7A7A] hover:text-[#8B9F82] transition-colors disabled:opacity-50"
              >
                {task.completed ? (
                  <CheckCircle2 className="size-5 text-[#8B9F82]" />
                ) : (
                  <Circle className="size-5" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium text-[#2D2D2D] truncate',
                    task.completed && 'line-through'
                  )}
                >
                  {task.title}
                </p>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5">
                  <span
                    className={cn(
                      'text-xs',
                      overdue ? 'text-red-600 font-medium' : 'text-[#7A7A7A]'
                    )}
                  >
                    {formatDueDate(task.due_date)}
                  </span>
                  {task.vendor && (
                    <span className="text-xs text-[#7A7A7A] truncate flex items-center gap-1">
                      <Link2 className="size-3 shrink-0" />
                      {task.vendor.category_icon && (
                        <span>{getVendorEmoji(task.vendor.category_icon)}</span>
                      )}
                      {task.vendor.name}
                    </span>
                  )}
                </div>
              </div>

              <Badge
                variant="secondary"
                className={cn(
                  'shrink-0 text-[10px] capitalize',
                  typeBadgeStyles[task.type] || typeBadgeStyles.other
                )}
              >
                {task.type.replace('_', ' ')}
              </Badge>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
