'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Circle,
  Users,
  DollarSign,
  ListTodo,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GettingStartedProps {
  hasVendors: boolean
  hasBudget: boolean
  hasBookedVendor: boolean
  hasTask: boolean
}

interface ChecklistItem {
  id: string
  label: string
  description: string
  href: string
  completed: boolean
  icon: React.ElementType
}

const DISMISSED_KEY = 'altared_getting_started_dismissed'

export function GettingStarted({
  hasVendors,
  hasBudget,
  hasBookedVendor,
  hasTask,
}: GettingStartedProps) {
  const [dismissed, setDismissed] = useState(true) // default hidden to avoid flash
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === '1')
  }, [])

  const items: ChecklistItem[] = [
    {
      id: 'vendor',
      label: 'Add your first vendor',
      description: 'Start building your vendor list',
      href: '/vendors',
      completed: hasVendors,
      icon: Users,
    },
    {
      id: 'budget',
      label: 'Set your wedding budget',
      description: 'Define your total budget in settings',
      href: '/settings',
      completed: hasBudget,
      icon: DollarSign,
    },
    {
      id: 'book',
      label: 'Book a vendor',
      description: 'Move a vendor to booked status',
      href: '/vendors',
      completed: hasBookedVendor,
      icon: CheckCircle2,
    },
    {
      id: 'task',
      label: 'Add a task',
      description: 'Create your first to-do or reminder',
      href: '/tasks',
      completed: hasTask,
      icon: ListTodo,
    },
  ]

  const completedCount = items.filter((i) => i.completed).length
  const allDone = completedCount === items.length
  const progressPercent = (completedCount / items.length) * 100

  if (dismissed || allDone) return null

  return (
    <Card className="border-[#8B9F82]/30 bg-[#8B9F82]/[0.03]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base text-[#2D2D2D]">
              Getting Started
            </CardTitle>
            <span className="text-xs text-[#7A7A7A]">
              {completedCount} of {items.length} complete
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setCollapsed(!collapsed)}
              className="text-[#7A7A7A] hover:text-[#2D2D2D]"
            >
              {collapsed ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronUp className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                localStorage.setItem(DISMISSED_KEY, '1')
                setDismissed(true)
              }}
              className="text-[#7A7A7A] hover:text-[#2D2D2D]"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#8B9F82]/10">
          <div
            className="h-full rounded-full bg-[#8B9F82] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="pt-0">
          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                    item.completed
                      ? 'opacity-60'
                      : 'hover:bg-[#8B9F82]/5'
                  )}
                >
                  {item.completed ? (
                    <CheckCircle2 className="size-5 shrink-0 text-[#8B9F82]" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-[#D1D5DB]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        item.completed
                          ? 'text-[#7A7A7A] line-through'
                          : 'text-[#2D2D2D]'
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs text-[#7A7A7A]">
                      {item.description}
                    </p>
                  </div>
                  <Icon
                    className={cn(
                      'size-4 shrink-0',
                      item.completed ? 'text-[#8B9F82]' : 'text-[#C9A96E]'
                    )}
                  />
                </Link>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
