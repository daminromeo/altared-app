'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { AccessGate, type SavedPlanSummary } from '@/components/paywall'

interface SidebarWrapperProps {
  children: React.ReactNode
  userProfile: {
    full_name: string | null
    avatar_url: string | null
    wedding_name: string | null
    email: string | null
  }
  locked: boolean
  summary: SavedPlanSummary | null
}

export function SidebarWrapper({ children, userProfile, locked, summary }: SidebarWrapperProps) {
  return (
    <div className="flex h-dvh bg-paper text-ink">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userProfile={userProfile} />

        <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 lg:px-8 lg:pb-8">
          <AccessGate serverLocked={locked} summary={summary}>
            {children}
          </AccessGate>
        </main>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </div>
  )
}
