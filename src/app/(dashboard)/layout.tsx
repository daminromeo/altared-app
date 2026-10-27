import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ACCESS_PROFILE_COLUMNS, resolveAccess, type AccessProfile } from '@/lib/plan-access'
import type { SavedPlanSummary } from '@/components/paywall'
import { SidebarWrapper } from './sidebar-wrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select(`full_name, avatar_url, wedding_name, total_budget, ${ACCESS_PROFILE_COLUMNS}`)
    .eq('id', user.id)
    .single()

  const userProfile = {
    full_name: profile?.full_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
    wedding_name: profile?.wedding_name ?? null,
    email: user.email ?? null,
  }

  // After the trial the app shows a paywall listing what they've saved
  const locked = resolveAccess(profile as AccessProfile | null).locked
  let summary: SavedPlanSummary | null = null
  if (locked) {
    const count = (table: string) =>
      supabase.from(table).select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    const [vendors, quotes, tasks] = await Promise.all([
      count('vendors'),
      count('proposals'),
      count('reminders').eq('is_completed', false),
    ])
    summary = {
      vendors: vendors.count ?? 0,
      quotes: quotes.count ?? 0,
      openTasks: tasks.count ?? 0,
      totalBudget: Number(profile?.total_budget ?? 0),
    }
  }

  return (
    <SidebarWrapper userProfile={userProfile} locked={locked} summary={summary}>
      {children}
    </SidebarWrapper>
  )
}
