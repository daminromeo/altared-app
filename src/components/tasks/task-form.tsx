'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ChevronDown, Check, X, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { getVendorEmoji } from '@/lib/vendor-icons'

interface Vendor {
  id: string
  name: string
  company_name: string | null
  vendor_categories?: { name: string; icon: string | null } | null
}

export interface TaskData {
  id: string
  user_id: string
  vendor_id: string | null
  title: string
  description: string | null
  due_date: string
  is_completed: boolean
  reminder_type: string | null
  created_at: string
  vendors?: { id: string; name: string; company_name: string | null; vendor_categories: { name: string; icon: string | null } | null } | null
}

const REMINDER_TYPES = [
  { value: 'payment', label: 'Payment' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'custom', label: 'Other' },
] as const

const taskFormSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  due_date: z.string().min(1, 'Due date is required'),
  reminder_type: z.string().optional(),
  vendor_id: z.string().optional(),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

function VendorPicker({
  value,
  onChange,
  vendors,
}: {
  value: string
  onChange: (value: string) => void
  vendors: Vendor[]
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.company_name?.toLowerCase().includes(search.toLowerCase())
  )

  const selected = vendors.find((v) => v.id === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className={selected ? 'text-[#2D2D2D]' : 'text-[#7A7A7A]'}>
          {selected ? (
            <span className="flex items-center gap-1.5">
              <Link2 className="size-3.5" />
              {selected.name}
              {selected.company_name && (
                <span className="text-[#7A7A7A]">({selected.company_name})</span>
              )}
            </span>
          ) : (
            'No vendor (general task)'
          )}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
                setOpen(false)
              }}
              className="rounded p-0.5 hover:bg-[#FAF8F5]"
            >
              <X className="size-3.5 text-[#7A7A7A]" />
            </button>
          )}
          <ChevronDown className={`size-4 text-[#7A7A7A] transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-full rounded-lg border bg-white py-1 shadow-lg">
          <div className="px-2 pb-1">
            <Input
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#7A7A7A] hover:bg-[#FAF8F5]"
            >
              No vendor (general task)
              {!value && <Check className="ml-auto size-4 text-[#8B9F82]" />}
            </button>
            {filtered.map((vendor) => (
              <button
                key={vendor.id}
                type="button"
                onClick={() => {
                  onChange(vendor.id)
                  setOpen(false)
                  setSearch('')
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#2D2D2D] hover:bg-[#FAF8F5]"
              >
                <div className="flex-1 text-left">
                  <span className="font-medium">{vendor.name}</span>
                  {vendor.vendor_categories && (
                    <span className="ml-1.5 text-xs text-[#7A7A7A]">
                      {getVendorEmoji(vendor.vendor_categories.icon)} {vendor.vendor_categories.name}
                    </span>
                  )}
                </div>
                {value === vendor.id && <Check className="size-4 text-[#8B9F82]" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-[#7A7A7A]">No vendors found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: TaskData | null
  onSuccess?: () => void
  defaultVendorId?: string
}

export function TaskForm({ open, onOpenChange, task, onSuccess, defaultVendorId }: TaskFormProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendor, setSelectedVendor] = useState<string>(task?.vendor_id ?? defaultVendorId ?? '')
  const [selectedType, setSelectedType] = useState<string>(task?.reminder_type ?? '')
  const [saving, setSaving] = useState(false)

  const isEditing = !!task
  const supabase = useMemo(() => createClient(), [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      due_date: task?.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      reminder_type: task?.reminder_type ?? '',
      vendor_id: task?.vendor_id ?? defaultVendorId ?? '',
    },
  })

  const fetchVendors = useCallback(async () => {
    const { data } = await supabase
      .from('vendors')
      .select('id, name, company_name, vendor_categories(name, icon)')
      .order('name')
    if (data) setVendors(data as Vendor[])
  }, [supabase])

  useEffect(() => {
    if (open) fetchVendors()
  }, [open, fetchVendors])

  useEffect(() => {
    if (task) {
      reset({
        title: task.title ?? '',
        description: task.description ?? '',
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
        reminder_type: task.reminder_type ?? '',
        vendor_id: task.vendor_id ?? '',
      })
      setSelectedVendor(task.vendor_id ?? '')
      setSelectedType(task.reminder_type ?? '')
    } else {
      reset({
        title: '',
        description: '',
        due_date: '',
        reminder_type: '',
        vendor_id: defaultVendorId ?? '',
      })
      setSelectedVendor(defaultVendorId ?? '')
      setSelectedType('')
    }
  }, [task, reset, defaultVendorId])

  async function onSubmit(values: TaskFormValues) {
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in')
        setSaving(false)
        return
      }

      const taskData = {
        title: values.title,
        description: values.description || null,
        due_date: new Date(values.due_date).toISOString(),
        reminder_type: selectedType || null,
        vendor_id: selectedVendor || null,
        user_id: user.id,
      }

      if (isEditing && task) {
        const { error } = await supabase
          .from('reminders')
          .update(taskData)
          .eq('id', task.id)

        if (error) throw error
        toast.success('Task updated')
      } else {
        const { error } = await supabase
          .from('reminders')
          .insert(taskData)

        if (error) throw error
        toast.success('Task created')
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('Error saving task:', err)
      toast.error('Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#2D2D2D]">
            {isEditing ? 'Edit Task' : 'New Task'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the task details below.'
              : 'Add a task or reminder for your wedding planning.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title">
              Title <span className="text-[#DC2626]">*</span>
            </Label>
            <Input
              id="task-title"
              placeholder="e.g. Pay venue deposit"
              {...register('title')}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs text-[#DC2626]">{errors.title.message}</p>
            )}
          </div>

          {/* Due Date & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-date">
                Due Date <span className="text-[#DC2626]">*</span>
              </Label>
              <Input
                id="task-date"
                type="date"
                {...register('due_date')}
                aria-invalid={!!errors.due_date}
              />
              {errors.due_date && (
                <p className="text-xs text-[#DC2626]">{errors.due_date.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex h-9 w-full items-center rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Select type</option>
                {REMINDER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Linked Vendor */}
          <div className="space-y-1.5">
            <Label>Linked Vendor</Label>
            <VendorPicker
              value={selectedVendor}
              onChange={setSelectedVendor}
              vendors={vendors}
            />
            <p className="text-[11px] text-[#7A7A7A]">
              Optionally link this task to a specific vendor
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-description">Notes</Label>
            <Textarea
              id="task-description"
              placeholder="Add any additional details..."
              rows={3}
              {...register('description')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#8B9F82] hover:bg-[#7A8E71] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Update Task'
              ) : (
                'Create Task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
