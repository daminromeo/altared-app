'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { BudgetOverview } from '@/components/budget/budget-overview'
import { BudgetCategory } from '@/components/budget/budget-category'
import { BudgetChart } from '@/components/budget/budget-chart'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { groupBy } from '@/lib/utils/index'
import type { BudgetItemData } from '@/components/budget/budget-item'

interface RawBudgetItem {
  id: string
  description: string
  estimated_cost: number
  actual_cost: number | null
  is_paid: boolean
  due_date: string | null
  vendor_id: string | null
  category_id: string | null
  vendors: { id: string; name: string } | null
  vendor_categories: { id: string; name: string; default_budget_percentage: number | null } | null
}

interface VendorCategory {
  id: string
  name: string
  default_budget_percentage: number | null
}

interface NewItemForm {
  description: string
  estimated_cost: number
  actual_cost: number
  due_date: string
  category_id: string
  vendor_id: string
}

const emptyForm: NewItemForm = {
  description: '',
  estimated_cost: 0,
  actual_cost: 0,
  due_date: '',
  category_id: '',
  vendor_id: '',
}

export default function BudgetPage() {
  const { user: authUser, isLoading: authLoading } = useAuth()
  const { isFreePlan } = useSubscription()
  const supabase = useMemo(() => createClient(), [])
  const [budgetItems, setBudgetItems] = useState<RawBudgetItem[]>([])
  const [categories, setCategories] = useState<VendorCategory[]>([])
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([])
  const [totalBudget, setTotalBudget] = useState(0)
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newItem, setNewItem] = useState<NewItemForm>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [customCategoryName, setCustomCategoryName] = useState('')

  const fetchData = useCallback(async () => {
    if (!authUser) return
    try {

    const [itemsRes, catsRes, vendorsRes, settingsRes, bookedVendorsRes] = await Promise.all([
      supabase
        .from('budget_items')
        .select(
          'id, description, estimated_cost, actual_cost, is_paid, due_date, vendor_id, category_id, vendors(id, name), vendor_categories(id, name, default_budget_percentage)'
        )
        .order('created_at', { ascending: false }),
      supabase
        .from('vendor_categories')
        .select('id, name, default_budget_percentage')
        .order('name'),
      supabase.from('vendors').select('id, name').order('name'),
      supabase
        .from('profiles')
        .select('total_budget')
        .single(),
      // Fetch booked vendors with payment info to sync budget items
      supabase
        .from('vendors')
        .select('id, category_id, deposit_paid, deposit_amount, final_price, quoted_price, metadata')
        .eq('status', 'booked'),
    ])

    // Build a map of vendor payment data
    const vendorPaymentMap = new Map<string, {
      categoryId: string | null
      isPaid: boolean
      actualCost: number
      estimatedCost: number
    }>()
    if (bookedVendorsRes.data) {
      for (const v of bookedVendorsRes.data) {
        const meta = v.metadata as Record<string, unknown> | null
        const paymentStatus = (meta?.payment_status as string) || (v.deposit_paid ? 'deposit_paid' : 'unpaid')
        const isPaid = paymentStatus === 'paid_in_full'
        const actualCost = paymentStatus === 'paid_in_full'
          ? (v.final_price || v.quoted_price || 0)
          : paymentStatus === 'deposit_paid'
            ? (v.deposit_amount || 0)
            : 0
        const estimatedCost = v.final_price || v.quoted_price || 0
        vendorPaymentMap.set(v.id, { categoryId: v.category_id, isPaid, actualCost, estimatedCost })
      }
    }

    // Sync budget items with vendor payment data
    let items = (itemsRes.data as unknown as RawBudgetItem[]) ?? []
    items = items.map((item) => {
      if (!item.vendor_id) return item
      const vendorPayment = vendorPaymentMap.get(item.vendor_id)
      if (!vendorPayment) return item
      return {
        ...item,
        is_paid: vendorPayment.isPaid,
        estimated_cost: vendorPayment.estimatedCost > 0 ? vendorPayment.estimatedCost : item.estimated_cost,
        actual_cost: vendorPayment.actualCost > 0 ? vendorPayment.actualCost : item.actual_cost,
        // Sync category from vendor if it changed
        category_id: vendorPayment.categoryId ?? item.category_id,
        vendor_categories: vendorPayment.categoryId && catsRes.data
          ? (catsRes.data as VendorCategory[]).find((c) => c.id === vendorPayment.categoryId) as RawBudgetItem['vendor_categories'] ?? item.vendor_categories
          : item.vendor_categories,
      }
    })

    setBudgetItems(items)
    if (catsRes.data) setCategories(catsRes.data as VendorCategory[])
    if (vendorsRes.data) setVendors(vendorsRes.data)
    if (settingsRes.data) setTotalBudget(settingsRes.data.total_budget ?? 0)
    } catch (err) {
      console.error('Budget fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [authUser, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const { committed, paid, categoryGroups, chartData } = useMemo(() => {
    const committed = budgetItems.reduce((sum, i) => sum + i.estimated_cost, 0)
    // Paid = sum of all actual_cost where any payment has been made (deposit or full)
    const paid = budgetItems.reduce((sum, i) => {
      if (i.actual_cost && i.actual_cost > 0) return sum + i.actual_cost
      return sum
    }, 0)

    const grouped = groupBy(
      budgetItems,
      (item) => item.vendor_categories?.id ?? 'uncategorized'
    )

    const categoryGroups = categories.map((cat) => ({
      ...cat,
      items: (grouped[cat.id] ?? []).map(
        (item): BudgetItemData => ({
          id: item.id,
          description: item.description,
          estimated_cost: item.estimated_cost,
          actual_cost: item.actual_cost,
          is_paid: item.is_paid,
          due_date: item.due_date,
          vendor_id: item.vendor_id,
          vendor_name: item.vendors?.name ?? null,
        })
      ),
    }))

    // Include uncategorized items if any
    const uncategorized = grouped['uncategorized'] ?? []
    if (uncategorized.length > 0) {
      categoryGroups.push({
        id: 'uncategorized',
        name: 'Uncategorized',
        default_budget_percentage: 0,
        items: uncategorized.map(
          (item): BudgetItemData => ({
            id: item.id,
            description: item.description,
            estimated_cost: item.estimated_cost,
            actual_cost: item.actual_cost,
            is_paid: item.is_paid,
            due_date: item.due_date,
            vendor_id: item.vendor_id,
            vendor_name: item.vendors?.name ?? null,
          })
        ),
      })
    }

    // Sort: categories with items first, then by total estimated cost descending
    categoryGroups.sort((a, b) => {
      if (a.items.length > 0 && b.items.length === 0) return -1
      if (a.items.length === 0 && b.items.length > 0) return 1
      const aTotal = a.items.reduce((sum, i) => sum + i.estimated_cost, 0)
      const bTotal = b.items.reduce((sum, i) => sum + i.estimated_cost, 0)
      return bTotal - aTotal
    })

    const chartData = categoryGroups
      .map((cat) => ({
        name: cat.name,
        value: cat.items.reduce((sum, i) => sum + i.estimated_cost, 0),
      }))
      .filter((c) => c.value > 0)

    return { committed, paid, categoryGroups, chartData }
  }, [budgetItems, categories])

  const otherCategory = categories.find((c) => c.name === 'Other')
  const isOtherSelected = newItem.category_id === otherCategory?.id

  function handleAddItem(categoryId: string) {
    setNewItem({ ...emptyForm, category_id: categoryId })
    setCustomCategoryName('')
    setDialogOpen(true)
  }

  async function saveNewItem() {
    if (!newItem.description.trim() || newItem.estimated_cost <= 0) {
      toast.error('Please provide a description and estimated cost.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('You must be logged in to add budget items.')
      return
    }

    setIsSaving(true)

    // If "Other" is selected with a custom name, create or reuse that category
    let categoryId = newItem.category_id || null
    if (isOtherSelected && customCategoryName.trim()) {
      const trimmedName = customCategoryName.trim()
      const { data: existing } = await supabase
        .from('vendor_categories')
        .select('id')
        .ilike('name', trimmedName)
        .maybeSingle()

      if (existing) {
        categoryId = existing.id
      } else {
        const { data: created, error: catErr } = await supabase
          .from('vendor_categories')
          .insert({ name: trimmedName, icon: 'plus', default_budget_percentage: 0, sort_order: 99, user_id: user.id })
          .select('id')
          .single()
        if (catErr) {
          toast.error('Failed to create custom category')
          setIsSaving(false)
          return
        }
        categoryId = created.id
      }
    }

    const { error } = await supabase.from('budget_items').insert({
      user_id: user.id,
      description: newItem.description.trim(),
      estimated_cost: newItem.estimated_cost,
      actual_cost: newItem.actual_cost > 0 ? newItem.actual_cost : 0,
      due_date: newItem.due_date || null,
      category_id: categoryId,
      vendor_id: newItem.vendor_id || null,
      is_paid: false,
    })

    setIsSaving(false)

    if (error) {
      toast.error('Failed to add budget item')
      return
    }

    toast.success('Budget item added')
    setDialogOpen(false)
    setNewItem(emptyForm)
    setCustomCategoryName('')
    fetchData()
  }

  if (authLoading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-[#FAF8F5]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[#FAF8F5]" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-[#FAF8F5]" />
    </div>
  )

  if (!authUser) return null

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[#FAF8F5]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[#FAF8F5]" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-[#FAF8F5]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2D2D2D]">
            Budget
          </h1>
          <p className="mt-1 text-sm text-[#7A7A7A]">
            Track your wedding expenses and stay on budget.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-[#8B9F82] text-white hover:bg-[#7A8E71]">
                <Plus className="size-4" />
                Add Budget Item
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Budget Item</DialogTitle>
              <DialogDescription>
                Add a new expense to your wedding budget.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-description">Description</Label>
                <Input
                  id="new-description"
                  placeholder="e.g., Venue deposit"
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem((d) => ({ ...d, description: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="new-estimated">Estimated Cost</Label>
                  <Input
                    id="new-estimated"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newItem.estimated_cost || ''}
                    onChange={(e) =>
                      setNewItem((d) => ({
                        ...d,
                        estimated_cost: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-actual">Actual Cost</Label>
                  <Input
                    id="new-actual"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newItem.actual_cost || ''}
                    onChange={(e) =>
                      setNewItem((d) => ({
                        ...d,
                        actual_cost: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-due-date">Due Date</Label>
                <Input
                  id="new-due-date"
                  type="date"
                  value={newItem.due_date}
                  onChange={(e) =>
                    setNewItem((d) => ({ ...d, due_date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={newItem.category_id}
                  onValueChange={(val) => {
                    setNewItem((d) => ({ ...d, category_id: val ?? '' }))
                    if (val !== otherCategory?.id) setCustomCategoryName('')
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category">
                      {(value: string) => categories.find((c) => c.id === value)?.name ?? value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} label={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isOtherSelected && (
                  <Input
                    placeholder="Enter custom category name"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    autoFocus
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Vendor (optional)</Label>
                <Select
                  value={newItem.vendor_id}
                  onValueChange={(val) =>
                    setNewItem((d) => ({ ...d, vendor_id: val ?? '' }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select vendor">
                      {(value: string) => vendors.find((v) => v.id === value)?.name ?? value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id} label={v.name}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={saveNewItem}
                disabled={isSaving || !newItem.description.trim()}
                className="bg-[#8B9F82] text-white hover:bg-[#7A8E71]"
              >
                {isSaving ? 'Adding...' : 'Add Item'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget overview stats */}
      <BudgetOverview
        totalBudget={totalBudget}
        committed={committed}
        paid={paid}
      />

      {/* Chart + categories layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Category sections */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#2D2D2D]">
            Budget Categories
          </h2>
          {categoryGroups.length > 0 ? (
            categoryGroups.map((cat) => (
              <BudgetCategory
                key={cat.id}
                categoryId={cat.id}
                categoryName={cat.name}
                allocatedAmount={
                  totalBudget > 0 && cat.default_budget_percentage
                    ? (cat.default_budget_percentage / 100) * totalBudget
                    : 0
                }
                totalBudget={totalBudget}
                items={cat.items}
                onAddItem={handleAddItem}
                onRefresh={fetchData}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#C9A96E]/30 bg-[#FAF8F5] py-16">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#C9A96E]/10">
                <DollarSign className="size-7 text-[#C9A96E]" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#2D2D2D]">
                No budget items yet
              </h3>
              <p className="mt-1 max-w-sm text-center text-sm text-[#7A7A7A]">
                Start adding budget items to track your wedding expenses. Create
                categories to organize them.
              </p>
              <Button
                className="mt-4 bg-[#8B9F82] text-white hover:bg-[#7A8E71]"
                onClick={() => {
                  setNewItem(emptyForm)
                  setDialogOpen(true)
                }}
              >
                <Plus className="size-4" />
                Add Budget Item
              </Button>
            </div>
          )}
        </div>

        {/* Pie chart — Pro/Premium only */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          {isFreePlan ? (
            <UpgradePrompt
              title="Budget Breakdown by Category"
              description="Upgrade to Pro for visual budget breakdowns, category allocation tracking, and more."
            />
          ) : (
            <BudgetChart categories={chartData} />
          )}
        </div>
      </div>
    </div>
  )
}
