import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
    .select('full_name, avatar_url, wedding_name')
    .eq('id', user.id)
    .single()

  const userProfile = {
    full_name: profile?.full_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
    wedding_name: profile?.wedding_name ?? null,
    email: user.email ?? null,
  }

  return <SidebarWrapper userProfile={userProfile}>{children}</SidebarWrapper>
}
