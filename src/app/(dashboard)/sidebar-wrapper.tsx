'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'

interface SidebarWrapperProps {
  children: React.ReactNode
  userProfile: {
    full_name: string | null
    avatar_url: string | null
    wedding_name: string | null
    email: string | null
  }
}

export function SidebarWrapper({ children, userProfile }: SidebarWrapperProps) {
  return (
    <div className="flex h-dvh bg-[#FAF8F5]">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userProfile={userProfile} />

        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </div>
  )
}
