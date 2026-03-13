'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Trash2, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/utils/format'

export interface BudgetItemData {
  id: string
  description: string
  estimated_cost: number
  actual_cost: number | null
  is_paid: boolean
  due_date: string | null
  vendor_id: string | null
  vendor_name: string | null
}

interface BudgetItemProps {
  item: BudgetItemData
  onUpdate: () => void
  onDelete: (id: string) => void
}

export function BudgetItem({ item, onUpdate, onDelete }: BudgetItemProps) {
  const supabase = useMemo(() => createClient(), [])
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editData, setEditData] = useState({
    description: item.description,
    estimated_cost: item.estimated_cost,
    actual_cost: item.actual_cost ?? 0,
    due_date: item.due_date ?? '',
  })
  const descriptionRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && descriptionRef.current) {
      descriptionRef.current.focus()
    }
  }, [isEditing])

  async function togglePaid() {
    const newPaid = !item.is_paid
    const { error } = await supabase
      .from('budget_items')
      .update({ is_paid: newPaid })
      .eq('id', item.id)

    if (error) {
      toast.error('Failed to update paid status')
      return
    }
    onUpdate()
  }

  async function saveEdit() {
    const { error } = await supabase
      .from('budget_items')
      .update({
        description: editData.description,
        estimated_cost: editData.estimated_cost,
        actual_cost: editData.actual_cost || 0,
        due_date: editData.due_date || null,
      })
      .eq('id', item.id)

    if (error) {
      toast.error('Failed to update item')
      return
    }
    setIsEditing(false)
    onUpdate()
    toast.success('Budget item updated')
  }

  async function handleDelete() {
    const { error } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', item.id)

    if (error) {
      toast.error('Failed to delete item')
      return
    }
    setConfirmDelete(false)
    onDelete(item.id)
    toast.success('Budget item deleted')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setEditData({
        description: item.description,
        estimated_cost: item.estimated_cost,
        actual_cost: item.actual_cost ?? 0,
        due_date: item.due_date ?? '',
      })
    }
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-[#8B9F82]/30 bg-[#FAF8F5] p-3">
        <div className="grid gap-2 sm:grid-cols-4">
          <Input
            ref={descriptionRef}
            value={editData.description}
            onChange={(e) =>
              setEditData((d) => ({ ...d, description: e.target.value }))
            }
            onKeyDown={handleKeyDown}
            placeholder="Description"
            className="sm:col-span-2"
          />
          <Input
            type="number"
            step="0.01"
            value={editData.estimated_cost}
            onChange={(e) =>
              setEditData((d) => ({
                ...d,
                estimated_cost: parseFloat(e.target.value) || 0,
              }))
            }
            onKeyDown={handleKeyDown}
            placeholder="Estimated"
          />
          <Input
            type="number"
            step="0.01"
            value={editData.actual_cost}
            onChange={(e) =>
              setEditData((d) => ({
                ...d,
                actual_cost: parseFloat(e.target.value) || 0,
              }))
            }
            onKeyDown={handleKeyDown}
            placeholder="Actual"
          />
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={editData.due_date}
            onChange={(e) =>
              setEditData((d) => ({ ...d, due_date: e.target.value }))
            }
            onKeyDown={handleKeyDown}
            className="max-w-[180px]"
          />
          <div className="ml-auto flex gap-1">
            <Button variant="ghost" size="icon-xs" onClick={() => setIsEditing(false)}>
              <X className="size-3" />
            </Button>
            <Button
              size="icon-xs"
              onClick={saveEdit}
              className="bg-[#8B9F82] text-white hover:bg-[#7A8E71]"
            >
              <Check className="size-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[#FAF8F5]"
      onDoubleClick={() => setIsEditing(true)}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={togglePaid}
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
          item.is_paid
            ? 'border-[#8B9F82] bg-[#8B9F82] text-white'
            : 'border-[#7A7A7A]/30 hover:border-[#8B9F82]'
        )}
      >
        {item.is_paid && <Check className="size-3" />}
      </button>

      {/* Description & vendor */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-medium text-[#2D2D2D]',
            item.is_paid && 'line-through opacity-60'
          )}
        >
          {item.description}
        </p>
        {item.vendor_name && (
          <p className="text-xs text-[#7A7A7A]">{item.vendor_name}</p>
        )}
      </div>

      {/* Amounts */}
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-sm font-semibold tabular-nums text-[#2D2D2D]">
          {formatCurrency(item.estimated_cost)}
        </p>
        {item.actual_cost !== null && item.actual_cost > 0 && (
          <p
            className={cn(
              'text-xs tabular-nums',
              item.actual_cost > item.estimated_cost
                ? 'text-red-600'
                : 'text-[#8B9F82]'
            )}
          >
            Paid: {formatCurrency(item.actual_cost)}
          </p>
        )}
      </div>

      {/* Due date */}
      {item.due_date && (
        <span className="hidden shrink-0 text-xs text-[#7A7A7A] lg:inline">
          Due {formatDate(item.due_date)}
        </span>
      )}

      {/* Paid badge */}
      {item.is_paid && (
        <span className="shrink-0 rounded-full bg-[#8B9F82]/10 px-2 py-0.5 text-xs font-medium text-[#8B9F82]">
          Paid
        </span>
      )}

      {/* Delete button */}
      {confirmDelete ? (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setConfirmDelete(false)}
          >
            <X className="size-3" />
          </Button>
          <Button
            variant="destructive"
            size="icon-xs"
            onClick={handleDelete}
          >
            <Check className="size-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setConfirmDelete(true)}
          className="text-[#7A7A7A] opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
        >
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
