'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { VendorPipeline, type BookingPaymentInfo } from '@/components/dashboard/vendor-pipeline'
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { GettingStarted } from '@/components/dashboard/getting-started'
import { DashboardUpgradeCard } from '@/components/dashboard/upgrade-card'
import { UpcomingPayments, type UpcomingPayment } from '@/components/dashboard/upcoming-payments'
import { DashboardSkeleton } from '@/components/shared/loading-skeleton'
import { useSubscription } from '@/lib/hooks/use-subscription'

interface DashboardData {
  stats: {
    totalBudget: number
    spentBudget: number
    vendorsContacted: number
    vendorsBooked: number
    weddingDate: string | null
    proposalCount: number
  }
  vendors: Array<{
    id: string
    name: string
    category: string
    price: number | null
    stage: 'researching' | 'contacted' | 'quoted' | 'meeting' | 'negotiating' | 'booked' | 'declined'
  }>
  tasks: Array<{
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
  }>
  activities: Array<{
    id: string
    type: 'vendor_added' | 'vendor_contacted' | 'vendor_booked' | 'payment_made' | 'proposal_received' | 'message_sent' | 'task_completed' | 'review_added'
    description: string
    created_at: string
    link?: string
  }>
  checklist: {
    hasVendors: boolean
    hasBudget: boolean
    hasBookedVendor: boolean
    hasTask: boolean
  }
  upcomingPayments: UpcomingPayment[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isFreePlan } = useSubscription()

  const supabase = useMemo(() => createClient(), [])

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Fetch all dashboard data in parallel
      const [
        weddingResult,
        vendorsResult,
        remindersResult,
        activitiesResult,
        proposalsResult,
      ] = await Promise.all([
        // Profile for budget and date
        supabase
          .from('profiles')
          .select('total_budget, wedding_date')
          .eq('id', user.id)
          .single(),

        // Vendors with pipeline info (join category name)
        supabase
          .from('vendors')
          .select('id, name, category_id, quoted_price, final_price, status, deposit_paid, deposit_amount, deposit_due_date, metadata, vendor_categories(name)')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),

        // Upcoming reminders / tasks (join linked vendor + category)
        supabase
          .from('reminders')
          .select('id, title, due_date, reminder_type, is_completed, vendors(name, vendor_categories(name, icon))')
          .eq('user_id', user.id)
          .order('due_date', { ascending: true })
          .limit(5),

        // Recent activity (using vendors as proxy since activities table doesn't exist)
        supabase
          .from('vendors')
          .select('id, name, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),

        // Proposals count
        supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ])

      // Compute stats
      const profileData = weddingResult.data
      const vendors = vendorsResult.data || []

      // Spent = sum of what's actually been paid
      // "paid_in_full" vendors: count full price (final_price ?? quoted_price)
      // "deposit_paid" vendors: count deposit_amount
      // "unpaid" vendors: count nothing
      const spentBudget = vendors
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

      const vendorsContacted = vendors.filter(
        (v) => v.status !== 'researching'
      ).length
      const vendorsBooked = vendors.filter(
        (v) => v.status === 'booked'
      ).length

      setData({
        stats: {
          totalBudget: profileData?.total_budget || 0,
          spentBudget,
          vendorsContacted,
          vendorsBooked,
          weddingDate: profileData?.wedding_date || null,
          proposalCount: proposalsResult.count || 0,
        },
        vendors: vendors.map((v) => ({
          id: v.id,
          name: v.name,
          category: (v as Record<string, unknown>).vendor_categories
            ? ((v as Record<string, unknown>).vendor_categories as { name: string }).name
            : 'Uncategorized',
          price: v.final_price || v.quoted_price,
          stage: (v.status === 'meeting_scheduled' ? 'meeting' : v.status as DashboardData['vendors'][number]['stage']) || 'researching',
        })),
        tasks: (remindersResult.data || []).map((r) => {
          const rv = (r as Record<string, unknown>).vendors as { name: string; vendor_categories: { name: string; icon: string | null } | null } | null
          return {
            id: r.id,
            title: r.title,
            due_date: r.due_date,
            type: (r.reminder_type as DashboardData['tasks'][number]['type']) || 'other',
            completed: r.is_completed || false,
            vendor: rv ? {
              name: rv.name,
              category_name: rv.vendor_categories?.name ?? null,
              category_icon: rv.vendor_categories?.icon ?? null,
            } : null,
          }
        }),
        activities: (activitiesResult.data || []).map((a) => ({
          id: a.id,
          type: 'vendor_added' as DashboardData['activities'][number]['type'],
          description: `${a.name} - ${a.status}`,
          created_at: a.created_at,
          link: undefined,
        })),
        checklist: {
          hasVendors: vendors.length > 0,
          hasBudget: (profileData?.total_budget || 0) > 0,
          hasBookedVendor: vendors.some((v) => v.status === 'booked'),
          hasTask: (remindersResult.data || []).length > 0,
        },
        upcomingPayments: vendors
          .filter(
            (v) =>
              v.status === 'booked' &&
              v.deposit_due_date &&
              !v.deposit_paid
          )
          .map((v) => ({
            id: v.id,
            vendorName: v.name,
            amount: v.deposit_amount || v.final_price || v.quoted_price || 0,
            dueDate: v.deposit_due_date as string,
            type: 'deposit' as const,
          }))
          .sort(
            (a, b) =>
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          )
          .slice(0, 5),
      })
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh the page.')
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    if (!data) return
    setData({
      ...data,
      tasks: data.tasks.map((t) =>
        t.id === taskId ? { ...t, completed } : t
      ),
    })
  }

  const handleStageChange = useCallback(async (vendorId: string, newStage: string, paymentInfo?: BookingPaymentInfo) => {
    if (!data) return

    // Optimistic update
    setData({
      ...data,
      vendors: data.vendors.map((v) =>
        v.id === vendorId ? { ...v, stage: newStage as DashboardData['vendors'][number]['stage'] } : v
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

  if (loading && !data) {
    return <DashboardSkeleton />
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-3 text-sm font-medium text-[#8B9F82] hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div>
        <h2
          className="text-xl font-bold text-[#2D2D2D] lg:text-2xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Welcome back
        </h2>
        <p className="mt-1 text-sm text-[#7A7A7A]">
          Here&apos;s an overview of your wedding planning progress.
        </p>
      </div>

      {/* Getting started checklist */}
      <GettingStarted {...data.checklist} />

      {/* Upgrade card for free users */}
      {isFreePlan && <DashboardUpgradeCard />}

      {/* Stats cards */}
      <StatsCards data={data.stats} loading={loading} />

      {/* Vendor pipeline */}
      <VendorPipeline vendors={data.vendors} loading={loading} onStageChange={handleStageChange} />

      {/* Bottom row: payments + tasks + activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <UpcomingPayments payments={data.upcomingPayments} loading={loading} />
        <UpcomingTasks
          tasks={data.tasks}
          loading={loading}
          onTaskToggle={handleTaskToggle}
        />
      </div>

      {/* Activity */}
      <RecentActivity activities={data.activities} loading={loading} />
    </div>
  )
}
