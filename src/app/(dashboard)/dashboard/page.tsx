'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/auth-provider'
import { toast } from 'sonner'
import { VendorPipeline, type BookingPaymentInfo } from '@/components/dashboard/vendor-pipeline'
import { Countdown } from '@/components/dashboard/countdown'
import { BudgetBar, type CategorySpend } from '@/components/dashboard/budget-bar'
import { NextUp, type NextUpItem } from '@/components/dashboard/next-up'
import { StarterPlanCard, type PlanTask } from '@/components/dashboard/starter-plan-card'
import { DashboardUpgradeCard } from '@/components/dashboard/upgrade-card'
import { TextPlannerPrompt } from '@/components/dashboard/text-planner-prompt'
import { DashboardSkeleton } from '@/components/shared/loading-skeleton'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { PLANS, TRIAL_LAUNCH_DATE } from '@/lib/stripe/config'
import { trackEvent } from '@/lib/analytics'
import { addStarterPlan, clearStarterPlan, weddingAnchor, type WeddingAnchor } from '@/lib/starter-plan'

type Stage = 'researching' | 'contacted' | 'quoted' | 'meeting' | 'negotiating' | 'booked' | 'declined'

interface DashboardData {
  anchor: WeddingAnchor
  dateEstimate: string | null
  location: string | null
  totalBudget: number
  committed: CategorySpend[]
  paid: number
  quoteCount: number
  vendors: Array<{
    id: string
    name: string
    category: string
    price: number | null
    stage: Stage
  }>
  nextUp: NextUpItem[]
  plan: PlanTask[]
}

interface Profile {
  total_budget: number | null
  wedding_date: string | null
  wedding_date_estimate?: string | null
  wedding_location: string | null
  onboarding_completed: boolean | null
  created_at: string | null
  /** Missing (undefined) until migration 010 has run */
  starter_plan_at?: string | null
}

interface ReminderRow {
  id: string
  title: string
  due_date: string
  reminder_type: string | null
  is_completed: boolean | null
  plan_key?: string | null
  vendors: { name: string; vendor_categories: { name: string } | null } | null
}

const DAY_MS = 24 * 60 * 60 * 1000
const NEXT_UP_LIMIT = 4
/** Stages where a vendor has (or is about to have) a quote worth comparing */
const COMPARABLE_STAGES = ['quoted', 'meeting_scheduled', 'negotiating']

const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

function daysFromNow(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS)
}

function dueText(iso: string) {
  const days = daysFromNow(iso)
  if (days < 0) return `${-days} ${days === -1 ? 'day' : 'days'} late`
  if (days === 0) return 'due today'
  return `due in ${days} ${days === 1 ? 'day' : 'days'}`
}

export default function DashboardPage() {
  const { user: authUser, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { refetch: refetchSubscription } = useSubscription()
  const seeding = useRef(false)

  const supabase = useMemo(() => createClient(), [])

  const fetchDashboardData = useCallback(async () => {
    if (!authUser) return
    try {
      setLoading(true)
      setError(null)

      const user = authUser

      // '*' so a schema without the newer columns still loads
      const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      const profile = profileRow as Profile | null

      // New couples get the starter plan on their first visit. Older accounts
      // are offered it from the plan card instead.
      const isNewAccount =
        !!profile?.created_at && new Date(profile.created_at) >= new Date(`${TRIAL_LAUNCH_DATE}T00:00:00Z`)
      if (profile?.onboarding_completed && profile.starter_plan_at === null && isNewAccount && !seeding.current) {
        seeding.current = true
        try {
          await addStarterPlan(supabase, user.id)
        } catch (err) {
          console.error('Starter plan not added:', err)
        }
      }

      const [vendorsResult, remindersResult, proposalsResult] = await Promise.all([
        supabase
          .from('vendors')
          .select('id, name, category_id, quoted_price, final_price, status, deposit_paid, deposit_amount, deposit_due_date, metadata, vendor_categories(name)')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),

        supabase
          .from('reminders')
          .select('*, vendors(name, vendor_categories(name))')
          .eq('user_id', user.id)
          .order('due_date', { ascending: true })
          .limit(200),

        supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ])

      const vendors = vendorsResult.data || []
      const reminders = (remindersResult.data || []) as ReminderRow[]
      const categoryOf = (v: (typeof vendors)[number]) =>
        ((v as Record<string, unknown>).vendor_categories as { name: string } | null)?.name ?? 'Other'

      // Spent = sum of what's actually been paid
      // "paid_in_full" vendors: count full price (final_price ?? quoted_price)
      // "deposit_paid" vendors: count deposit_amount
      // "unpaid" vendors: count nothing
      const paid = vendors
        .filter((v) => v.status === 'booked' && v.deposit_paid)
        .reduce((sum, v) => {
          const meta = v.metadata as Record<string, unknown> | null
          const paymentStatus = meta?.payment_status as string | undefined
          if (paymentStatus === 'paid_in_full') {
            return sum + (v.final_price || v.quoted_price || 0)
          }
          // deposit_paid or legacy booked vendors
          return sum + (v.deposit_amount || 0)
        }, 0)

      // Committed = the full price of every booked vendor, by category
      const committedByCategory = new Map<string, number>()
      for (const v of vendors) {
        if (v.status !== 'booked') continue
        const price = v.final_price || v.quoted_price || 0
        if (price > 0) committedByCategory.set(categoryOf(v), (committedByCategory.get(categoryOf(v)) ?? 0) + price)
      }

      // Next up: unpaid deposits, then quotes to compare, then tasks, by date
      const payments: NextUpItem[] = vendors
        .filter((v) => v.status === 'booked' && v.deposit_due_date && !v.deposit_paid)
        .map((v) => ({
          id: `payment-${v.id}`,
          title: `Deposit · ${v.name}`,
          detail: `${v.deposit_amount ? `${money(v.deposit_amount)} · ` : ''}${dueText(v.deposit_due_date as string)}`,
          href: `/vendors/${v.id}`,
          date: v.deposit_due_date as string,
          kind: 'payment' as const,
          dueSoon: daysFromNow(v.deposit_due_date as string) <= 7,
        }))

      const comparable = new Map<string, typeof vendors>()
      for (const v of vendors) {
        if (!COMPARABLE_STAGES.includes(v.status)) continue
        comparable.set(categoryOf(v), [...(comparable.get(categoryOf(v)) ?? []), v])
      }
      const compares: NextUpItem[] = [...comparable.entries()]
        .filter(([, group]) => group.length >= 2)
        .map(([category, group]) => ({
          id: `compare-${category}`,
          title: `Compare ${category.toLowerCase()} quotes`,
          detail: `${group.length} quotes in`,
          href: `/vendors/compare?ids=${group.slice(0, 4).map((v) => v.id).join(',')}`,
          date: null,
          kind: 'compare' as const,
        }))

      const tasks: NextUpItem[] = reminders
        .filter((r) => !r.is_completed && daysFromNow(r.due_date) <= 30)
        .map((r) => ({
          id: `task-${r.id}`,
          title: r.vendors ? `${r.title} · ${r.vendors.name}` : r.title,
          detail: r.plan_key ? `From your plan · ${dueText(r.due_date)}` : dueText(r.due_date),
          href: '/tasks',
          date: r.due_date,
          kind: r.plan_key ? ('plan' as const) : ('task' as const),
          dueSoon: daysFromNow(r.due_date) <= 3,
        }))

      const byDate = (a: NextUpItem, b: NextUpItem) => new Date(a.date!).getTime() - new Date(b.date!).getTime()
      const dated = [...payments, ...tasks].sort(byDate)
      const urgent = dated.filter((item) => item.dueSoon)
      const later = dated.filter((item) => !item.dueSoon)
      const nextUp = [...urgent, ...compares, ...later].slice(0, NEXT_UP_LIMIT)

      setData({
        anchor: weddingAnchor(profile ?? { wedding_date: null }),
        dateEstimate: profile?.wedding_date_estimate ?? null,
        location: profile?.wedding_location ?? null,
        totalBudget: profile?.total_budget || 0,
        committed: [...committedByCategory.entries()].map(([category, amount]) => ({ category, amount })),
        paid,
        quoteCount: proposalsResult.count || 0,
        vendors: vendors.map((v) => ({
          id: v.id,
          name: v.name,
          category: categoryOf(v),
          price: v.final_price || v.quoted_price,
          stage: (v.status === 'meeting_scheduled' ? 'meeting' : (v.status as Stage)) || 'researching',
        })),
        nextUp,
        plan: reminders
          .filter((r) => r.plan_key)
          .map((r) => ({ id: r.id, title: r.title, due_date: r.due_date, completed: !!r.is_completed })),
      })
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh the page.')
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [authUser, supabase])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Back from Stripe Checkout. The webhook that grants the pass can land a
  // moment after the redirect, so refresh plan access a few times.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('pass') !== 'active') return
    window.history.replaceState(null, '', window.location.pathname)
    trackEvent('purchase', { currency: 'USD', value: PLANS.pass.price, item_name: 'Wedding Pass' })
    toast.success('Your Wedding Pass is active. Everything is unlocked through your wedding.')
    const timers = [0, 2000, 5000, 10000].map((ms) => setTimeout(() => refetchSubscription(), ms))
    return () => timers.forEach(clearTimeout)
  }, [refetchSubscription])

  const handlePlanToggle = useCallback(async (taskId: string, completed: boolean) => {
    setData((d) => d && { ...d, plan: d.plan.map((t) => (t.id === taskId ? { ...t, completed } : t)) })
    const { error } = await supabase.from('reminders').update({ is_completed: completed }).eq('id', taskId)
    if (error) {
      toast.error("Couldn't update that task. Try again.")
      fetchDashboardData()
    }
  }, [supabase, fetchDashboardData])

  const handleAddPlan = useCallback(async () => {
    if (!authUser) return
    try {
      const added = await addStarterPlan(supabase, authUser.id)
      toast.success(added > 0 ? `Added ${added} tasks to your plan.` : 'Your plan is already up to date.')
      trackEvent('starter_plan_added', { tasks: added })
      fetchDashboardData()
    } catch (err) {
      console.error('Starter plan not added:', err)
      toast.error("Couldn't add the plan. Try again in a moment.")
    }
  }, [authUser, supabase, fetchDashboardData])

  const handleClearPlan = useCallback(async () => {
    if (!authUser) return
    try {
      await clearStarterPlan(supabase, authUser.id)
      trackEvent('starter_plan_cleared')
      toast.success('Plan cleared.')
      fetchDashboardData()
    } catch (err) {
      console.error('Starter plan not cleared:', err)
      toast.error("Couldn't clear the plan. Try again in a moment.")
      throw err
    }
  }, [authUser, supabase, fetchDashboardData])

  const handleStageChange = useCallback(async (vendorId: string, newStage: string, paymentInfo?: BookingPaymentInfo) => {
    if (!data) return

    // Optimistic update
    setData({
      ...data,
      vendors: data.vendors.map((v) =>
        v.id === vendorId ? { ...v, stage: newStage as Stage } : v
      ),
    })

    // Map pipeline stage back to vendor status
    const statusMap: Record<string, string> = {
      researching: 'researching',
      contacted: 'contacted',
      quoted: 'quoted',
      meeting: 'meeting_scheduled',
      negotiating: 'negotiating',
      booked: 'booked',
      declined: 'declined',
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      status: statusMap[newStage] || newStage,
    }

    // Always set is_booked when moving to booked stage
    if (newStage === 'booked') {
      updatePayload.is_booked = true
      updatePayload.booked_date = new Date().toISOString().split('T')[0]
    }

    // If booking with payment info, update payment fields
    if (newStage === 'booked' && paymentInfo) {

      if (paymentInfo.paymentStatus === 'paid_in_full') {
        updatePayload.deposit_paid = true
        updatePayload.deposit_amount = paymentInfo.amountPaid
      } else if (paymentInfo.paymentStatus === 'deposit_paid') {
        updatePayload.deposit_paid = true
        updatePayload.deposit_amount = paymentInfo.amountPaid
      } else {
        updatePayload.deposit_paid = false
        updatePayload.deposit_amount = 0
      }

      // Store payment status in metadata
      updatePayload.metadata = { payment_status: paymentInfo.paymentStatus }
    }

    const { error } = await supabase
      .from('vendors')
      .update(updatePayload)
      .eq('id', vendorId)

    if (error) {
      console.error('Failed to update vendor stage:', JSON.stringify(error, null, 2))
      toast.error(`Failed to move vendor: ${error.message || error.code || 'Unknown error'}`)
      fetchDashboardData()
    } else {
      toast.success(newStage === 'booked' ? 'Vendor booked!' : 'Vendor stage updated')
      // Refresh to get updated budget figures
      if (newStage === 'booked') fetchDashboardData()
    }
  }, [data, supabase, fetchDashboardData])

  // Show skeleton while auth is resolving (brief — fires once on INITIAL_SESSION)
  if (authLoading) return <DashboardSkeleton />

  // Auth resolved but no user — middleware handles redirect; show nothing
  if (!authUser) return null

  // Auth resolved, user present, waiting for first data load
  if (loading && !data) return <DashboardSkeleton />

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-error">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-3 text-sm font-medium text-moss hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
      <DashboardUpgradeCard vendors={data.vendors.length} quotes={data.quoteCount} />
      <TextPlannerPrompt />

      <div className="flex flex-col gap-4 pb-1 pt-2 sm:flex-row sm:items-end sm:justify-between">
        <Countdown anchor={data.anchor} estimate={data.dateEstimate} location={data.location} />
        <div className="flex gap-2">
          <Link
            href="/tasks"
            className="inline-flex h-11 items-center rounded-full border border-hairline bg-white px-4 font-display text-sm font-bold text-ink transition-colors hover:bg-paper"
          >
            Add a task
          </Link>
          <Link
            href="/proposals/upload"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-moss px-5 font-display text-sm font-bold text-white transition-colors hover:bg-moss-light sm:flex-none"
          >
            {data.quoteCount === 0 ? 'Add your first quote' : 'Add a quote'}
          </Link>
        </div>
      </div>

      <BudgetBar totalBudget={data.totalBudget} committed={data.committed} paid={data.paid} />

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <NextUp items={data.nextUp} />
        <StarterPlanCard
          tasks={data.plan}
          onToggle={handlePlanToggle}
          onAdd={handleAddPlan}
          onClear={handleClearPlan}
        />
      </div>

      <VendorPipeline vendors={data.vendors} loading={loading} onStageChange={handleStageChange} />
    </div>
  )
}
