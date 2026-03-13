'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Camera,
  Flower2,
  Music,
  UtensilsCrossed,
  Cake,
  Shirt,
  MapPin,
  BedDouble,
  PartyPopper,
  Heart,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BudgetItem, type BudgetItemData } from '@/components/budget/budget-item'

const categoryIcons: Record<string, React.ElementType> = {
  venue: MapPin,
  catering: UtensilsCrossed,
  photography: Camera,
  videography: Camera,
  florist: Flower2,
  music: Music,
  dj: Music,
  cake: Cake,
  bakery: Cake,
  attire: Shirt,
  dress: Shirt,
  entertainment: PartyPopper,
  decor: Heart,
  decorations: Heart,
  lodging: BedDouble,
  hotel: BedDouble,
  default: Heart,
}

function getCategoryIcon(categoryName: string): React.ElementType {
  const key = categoryName.toLowerCase()
  for (const [pattern, icon] of Object.entries(categoryIcons)) {
    if (key.includes(pattern)) return icon
  }
  return categoryIcons.default
}

interface BudgetCategoryProps {
  categoryId: string
  categoryName: string
  allocatedAmount: number
  totalBudget: number
  items: BudgetItemData[]
  onAddItem: (categoryId: string) => void
  onRefresh: () => void
}

export function BudgetCategory({
  categoryId,
  categoryName,
  allocatedAmount,
  totalBudget,
  items,
  onAddItem,
  onRefresh,
}: BudgetCategoryProps) {
  const supabase = useMemo(() => createClient(), [])
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [editBudgetValue, setEditBudgetValue] = useState('')
  const budgetInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingBudget && budgetInputRef.current) {
      budgetInputRef.current.focus()
      budgetInputRef.current.select()
    }
  }, [isEditingBudget])

  const totalEstimated = items.reduce((sum, item) => sum + item.estimated_cost, 0)
  const spentPercent =
    allocatedAmount > 0
      ? Math.min((totalEstimated / allocatedAmount) * 100, 100)
      : 0
  const isOverAllocated = totalEstimated > allocatedAmount && allocatedAmount > 0

  const Icon = getCategoryIcon(categoryName)

  function handleDeleteItem(_id: string) {
    onRefresh()
  }

  function startEditBudget(e: React.MouseEvent) {
    e.stopPropagation()
    setEditBudgetValue(allocatedAmount > 0 ? allocatedAmount.toString() : '')
    setIsEditingBudget(true)
  }

  async function saveBudget() {
    const newAmount = parseFloat(editBudgetValue) || 0
    const newPercentage = totalBudget > 0 ? (newAmount / totalBudget) * 100 : 0

    if (categoryId === 'uncategorized') {
      setIsEditingBudget(false)
      return
    }

    const { error } = await supabase
      .from('vendor_categories')
      .update({ default_budget_percentage: Math.round(newPercentage * 100) / 100 })
      .eq('id', categoryId)

    if (error) {
      toast.error('Failed to update budget allocation')
      return
    }

    setIsEditingBudget(false)
    onRefresh()
    toast.success('Budget allocation updated')
  }

  function handleBudgetKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveBudget()
    }
    if (e.key === 'Escape') {
      setIsEditingBudget(false)
    }
  }

  return (
    <div className="group/cat overflow-hidden rounded-xl border bg-white">
      {/* Category header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(!isExpanded) }}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#FAF8F5]"
      >
        <div className="flex size-9 items-center justify-center rounded-lg bg-[#8B9F82]/10">
          <Icon className="size-4.5 text-[#8B9F82]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#2D2D2D]">
              {categoryName}
            </p>
            <span className="rounded-full bg-[#FAF8F5] px-2 py-0.5 text-xs text-[#7A7A7A]">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          {/* Mini progress bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#FAF8F5]">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isOverAllocated ? 'bg-red-400' : 'bg-[#8B9F82]'
                )}
                style={{ width: `${spentPercent}%` }}
              />
            </div>
            <span className="shrink-0 text-xs tabular-nums text-[#7A7A7A]">
              {formatCurrency(totalEstimated)}
              {allocatedAmount > 0 && (
                <>
                  {' '}/ {formatCurrency(allocatedAmount)}
                  <span
                    className={cn(
                      'ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                      isOverAllocated
                        ? 'bg-red-100 text-red-600'
                        : 'bg-[#8B9F82]/10 text-[#8B9F82]'
                    )}
                  >
                    {spentPercent.toFixed(0)}% of budget
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
        {/* Edit budget button */}
        {!isEditingBudget && categoryId !== 'uncategorized' && (
          <button
            type="button"
            onClick={startEditBudget}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#7A7A7A] opacity-0 transition-opacity hover:bg-[#FAF8F5] hover:text-[#2D2D2D] group-hover/cat:opacity-100"
            title="Edit budget allocation"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
        {isExpanded ? (
          <ChevronDown className="size-4 shrink-0 text-[#7A7A7A]" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-[#7A7A7A]" />
        )}
      </div>

      {/* Inline budget edit */}
      {isEditingBudget && (
        <div
          className="flex items-center gap-2 border-t bg-[#FAF8F5] px-4 py-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs font-medium text-[#7A7A7A]">Category Budget:</span>
          <span className="text-xs text-[#7A7A7A]">$</span>
          <Input
            ref={budgetInputRef}
            type="number"
            step="100"
            min="0"
            value={editBudgetValue}
            onChange={(e) => setEditBudgetValue(e.target.value)}
            onKeyDown={handleBudgetKeyDown}
            className="h-7 w-32 text-sm"
            placeholder="0.00"
          />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsEditingBudget(false)}
          >
            <X className="size-3" />
          </Button>
          <Button
            size="icon-xs"
            onClick={saveBudget}
            className="bg-[#8B9F82] text-white hover:bg-[#7A8E71]"
          >
            <Check className="size-3" />
          </Button>
        </div>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t">
          {items.length > 0 ? (
            <div className="divide-y">
              {items.map((item) => (
                <BudgetItem
                  key={item.id}
                  item={item}
                  onUpdate={onRefresh}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-[#7A7A7A]">
                No items in this category yet.
              </p>
            </div>
          )}
          <div className="border-t px-4 py-2.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddItem(categoryId)}
              className="w-full text-[#8B9F82] hover:bg-[#8B9F82]/5 hover:text-[#7A8E71]"
            >
              <Plus className="size-3.5" />
              Add Item
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
