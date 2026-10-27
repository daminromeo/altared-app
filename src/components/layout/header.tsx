'use client'

import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/layout/user-menu'
import { TrialChip } from '@/components/layout/trial-status'
import { useAuth } from '@/providers/auth-provider'
import { useSubscription } from '@/lib/hooks/use-subscription'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Home',
  '/vendors/compare': 'Compare',
  '/vendors': 'Vendors',
  '/tasks': 'Tasks',
  '/proposals': 'Quotes',
  '/budget': 'Budget',
  '/messages': 'Comm Log',
  '/settings': 'Settings',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  // Longest prefix first, so /vendors/compare/x isn't titled "Vendors"
  const match = Object.keys(pageTitles)
    .sort((a, b) => b.length - a.length)
    .find((path) => pathname.startsWith(path + '/'))
  return match ? pageTitles[match] : 'Home'
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
  const { isTrial, trialDaysLeft } = useSubscription()
  // Prefer auth context (reactive on client) over server prop (static after SSR)
  const weddingName = authProfile?.wedding_name ?? userProfile?.wedding_name

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-paper px-4 sm:h-16 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate font-display text-base font-bold tracking-[-0.02em] text-ink sm:text-lg">
          {title}
        </h1>
        {weddingName && (
          <span className="hidden truncate text-sm text-ink-muted sm:inline">· {weddingName}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* The sidebar shows trial status on desktop */}
        {isTrial && (
          <span className="lg:hidden">
            <TrialChip daysLeft={trialDaysLeft} urgent={trialDaysLeft <= 3} />
          </span>
        )}
        <UserMenu userProfile={userProfile} />
      </div>
    </header>
  )
}
