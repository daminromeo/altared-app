'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus,
  CheckCircle2,
  Circle,
  CalendarDays,
  Trash2,
  Pencil,
  Link2,
  Filter,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { TaskForm, type TaskData } from '@/components/tasks/task-form'
import { getVendorEmoji } from '@/lib/vendor-icons'

type ReminderType = 'payment' | 'deposit' | 'meeting' | 'follow_up' | 'deadline' | 'custom'

const typeBadgeStyles: Record<string, string> = {
  payment: 'bg-[#C9A96E]/10 text-[#C9A96E]',
  deposit: 'bg-[#C9A96E]/10 text-[#C9A96E]',
  meeting: 'bg-purple-50 text-purple-700',
  deadline: 'bg-red-50 text-red-700',
  follow_up: 'bg-blue-50 text-blue-700',
  custom: 'bg-gray-100 text-gray-700',
}

const TYPE_LABELS: Record<string, string> = {
  payment: 'Payment',
  deposit: 'Deposit',
  meeting: 'Meeting',
  follow_up: 'Follow Up',
  deadline: 'Deadline',
  custom: 'Other',
}

/** Extract YYYY-MM-DD from a date string, treating it as a calendar date (no timezone shift) */
function toLocalDateStr(dateStr: string): string {
  // If the string is an ISO timestamp, extract just the date part
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0]
  }
  return dateStr.slice(0, 10)
}

function getTodayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function dateDiffDays(dateStr: string): number {
  const parts = toLocalDateStr(dateStr).split('-').map(Number)
  const dueDateMs = Date.UTC(parts[0], parts[1] - 1, parts[2])
  const todayParts = getTodayStr().split('-').map(Number)
  const todayMs = Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2])
  return Math.round((dueDateMs - todayMs) / (1000 * 60 * 60 * 24))
}

function formatDueDate(dateStr: string): string {
  const diffDays = dateDiffDays(dateStr)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
  if (diffDays <= 7) return `In ${diffDays} days`

  // Parse as local date to avoid timezone shift in display
  const parts = toLocalDateStr(dateStr).split('-').map(Number)
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatFullDate(dateStr: string): string {
  const parts = toLocalDateStr(dateStr).split('-').map(Number)
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function isOverdue(dateStr: string): boolean {
  return dateDiffDays(dateStr) < 0
}

type FilterView = 'all' | 'upcoming' | 'overdue' | 'completed'

export default function TasksPage() {
  const supabase = useMemo(() => createClient(), [])
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskData | null>(null)
  const [filterView, setFilterView] = useState<FilterView>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('reminders')
        .select('*, vendors(id, name, company_name, vendor_categories(name, icon))')
        .order('due_date', { ascending: true })

      if (error) throw error
      setTasks((data as TaskData[]) ?? [])
    } catch (err) {
      console.error('Error fetching tasks:', err)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const filteredTasks = useMemo(() => {
    let result = tasks

    if (filterView === 'upcoming') {
      result = result.filter((t) => !t.is_completed && dateDiffDays(t.due_date) >= 0)
    } else if (filterView === 'overdue') {
      result = result.filter((t) => !t.is_completed && dateDiffDays(t.due_date) < 0)
    } else if (filterView === 'completed') {
      result = result.filter((t) => t.is_completed)
    }

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((t) => t.reminder_type === filterType)
    }

    return result
  }, [tasks, filterView, filterType])

  const counts = useMemo(() => {
    return {
      all: tasks.length,
      upcoming: tasks.filter((t) => !t.is_completed && dateDiffDays(t.due_date) >= 0).length,
      overdue: tasks.filter((t) => !t.is_completed && dateDiffDays(t.due_date) < 0).length,
      completed: tasks.filter((t) => t.is_completed).length,
    }
  }, [tasks])

  async function handleToggle(task: TaskData) {
    const newCompleted = !task.is_completed
    setCompletingIds((prev) => new Set(prev).add(task.id))

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_completed: newCompleted } : t))
    )

    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_completed: newCompleted })
        .eq('id', task.id)

      if (error) throw error
    } catch {
      // Revert
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, is_completed: !newCompleted } : t))
      )
      toast.error('Failed to update task')
    } finally {
      setCompletingIds((prev) => {
        const next = new Set(prev)
        next.delete(task.id)
        return next
      })
    }
  }

  async function handleDelete(taskId: string) {
    setDeletingId(taskId)
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    } finally {
      setDeletingId(null)
    }
  }

  function openEdit(task: TaskData) {
    setEditingTask(task)
    setFormOpen(true)
  }

  function openCreate() {
    setEditingTask(null)
    setFormOpen(true)
  }

  const viewTabs: { key: FilterView; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { key: 'overdue', label: 'Overdue', count: counts.overdue },
    { key: 'completed', label: 'Completed', count: counts.completed },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#2D2D2D]">Tasks</h1>
          <p className="text-sm text-[#7A7A7A] mt-1">
            Manage your wedding planning tasks and reminders
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#8B9F82] hover:bg-[#7A8E71] text-white text-sm w-fit"
        >
          <Plus className="size-4" />
          New Task
        </Button>
      </div>

      {/* View tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {viewTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterView(tab.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all',
              filterView === tab.key
                ? 'bg-[#8B9F82] text-white shadow-sm'
                : 'bg-[#FAF8F5] text-[#2D2D2D] hover:bg-[#8B9F82]/10'
            )}
          >
            {tab.label}
            <span
              className={cn(
                'ml-0.5 inline-flex size-5 items-center justify-center rounded-full text-[11px]',
                filterView === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-white text-[#7A7A7A]'
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}

        {/* Type filter */}
        <div className="ml-auto flex items-center gap-2">
          <Filter className="size-4 text-[#7A7A7A]" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
          >
            <option value="all">All types</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <Card className="bg-white p-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="size-5 rounded-full bg-[#FAF8F5]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-48 rounded bg-[#FAF8F5]" />
                  <div className="h-3 w-24 rounded bg-[#FAF8F5]" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : filteredTasks.length === 0 ? (
        <Card className="bg-white">
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#FAF8F5]">
              <CalendarDays className="size-6 text-[#7A7A7A]" />
            </div>
            <h3
              className="mt-4 text-base font-semibold text-[#2D2D2D]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {filterView === 'completed'
                ? 'No completed tasks yet'
                : filterView === 'overdue'
                  ? 'No overdue tasks'
                  : 'No tasks yet'}
            </h3>
            <p className="mt-1.5 max-w-sm text-sm text-[#7A7A7A]">
              {filterView === 'all' && !filterType
                ? 'Create your first task to start tracking your wedding planning to-dos.'
                : 'No tasks match the current filters.'}
            </p>
            {filterView === 'all' && filterType === 'all' && (
              <Button
                onClick={openCreate}
                className="mt-5 bg-[#8B9F82] hover:bg-[#7A8E71] text-white"
              >
                <Plus className="size-4" />
                New Task
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="bg-white divide-y divide-[#E5E7EB]">
          {filteredTasks.map((task) => {
            const overdue = isOverdue(task.due_date) && !task.is_completed
            const completing = completingIds.has(task.id)
            const deleting = deletingId === task.id
            const vendor = task.vendors

            return (
              <div
                key={task.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[#FAF8F5]/50',
                  task.is_completed && 'opacity-60'
                )}
              >
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(task)}
                  disabled={completing}
                  className="mt-0.5 shrink-0 text-[#7A7A7A] hover:text-[#8B9F82] transition-colors disabled:opacity-50"
                >
                  {task.is_completed ? (
                    <CheckCircle2 className="size-5 text-[#8B9F82]" />
                  ) : (
                    <Circle className="size-5" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        'text-sm font-medium text-[#2D2D2D]',
                        task.is_completed && 'line-through'
                      )}
                    >
                      {task.title}
                    </p>
                    {task.reminder_type && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] capitalize',
                          typeBadgeStyles[task.reminder_type] || typeBadgeStyles.custom
                        )}
                      >
                        {TYPE_LABELS[task.reminder_type] || task.reminder_type}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                      className={cn(
                        'text-xs',
                        overdue ? 'font-medium text-red-600' : 'text-[#7A7A7A]'
                      )}
                      title={formatFullDate(task.due_date)}
                    >
                      <CalendarDays className="mr-1 inline size-3" />
                      {formatDueDate(task.due_date)}
                    </span>

                    {vendor && (
                      <span className="text-xs text-[#7A7A7A]">
                        <Link2 className="mr-1 inline size-3" />
                        {vendor.vendor_categories?.icon && (
                          <span className="mr-0.5">{getVendorEmoji(vendor.vendor_categories.icon)}</span>
                        )}
                        {vendor.name}
                      </span>
                    )}

                    {task.description && (
                      <span className="text-xs text-[#7A7A7A] truncate max-w-[200px]">
                        {task.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => openEdit(task)}
                    className="rounded p-1.5 text-[#7A7A7A] hover:bg-[#FAF8F5] hover:text-[#2D2D2D] transition-colors"
                    title="Edit task"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    disabled={deleting}
                    className="rounded p-1.5 text-[#7A7A7A] hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Delete task"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </Card>
      )}

      {/* Task form modal */}
      <TaskForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingTask(null)
        }}
        task={editingTask}
        onSuccess={fetchTasks}
      />
    </div>
  )
}
