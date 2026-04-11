'use client'

import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/layout/user-menu'
import { useAuth } from '@/providers/auth-provider'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/vendors': 'Vendors',
  '/tasks': 'Tasks',
  '/proposals': 'Proposals',
  '/budget': 'Budget',
  '/messages': 'Communication Log',
  '/settings': 'Profile & Settings',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path + '/')) return title
  }
  return 'Dashboard'
}

interface HeaderProps {
  userProfile: {
    full_name: string | null
    avatar_url: string | null
    wedding_name: string | null
    email: string | null
  } | null
}

export function Header({ userProfile }: HeaderProps) {
  const pathname = usePathname()
  const title = getPageTitle(pathname)
  const { profile: authProfile } = useAuth()
  // Prefer auth context (reactive on client) over server prop (static after SSR)
  const weddingName = authProfile?.wedding_name ?? userProfile?.wedding_name

  return (
    <header className="flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-border bg-white px-3 sm:px-4 lg:px-6">
      {/* Page title + wedding name */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <h1
          className="text-base sm:text-lg lg:text-xl font-semibold text-[#2D2D2D] truncate"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {title}
        </h1>
        {weddingName && (
          <>
            <span className="hidden sm:inline text-[#D1D5DB]">|</span>
            <span className="hidden sm:inline text-sm text-[#7A7A7A] truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {weddingName}
            </span>
          </>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <UserMenu userProfile={userProfile} />
      </div>
    </header>
  )
}
