import {
  LayoutDashboard,
  Users,
  FileText,
  Scale,
  DollarSign,
  BookOpen,
  Settings,
  CalendarCheck,
} from 'lucide-react'

// App navigation, shared by the desktop sidebar and the mobile tab bar.

export const NAV_LINKS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/vendors', label: 'Vendors', icon: Users },
  { href: '/proposals', label: 'Quotes', icon: FileText },
  { href: '/vendors/compare', label: 'Compare', icon: Scale },
  { href: '/budget', label: 'Budget', icon: DollarSign },
  { href: '/tasks', label: 'Tasks', icon: CalendarCheck },
  { href: '/messages', label: 'Comm Log', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const

/** Shown in the mobile tab bar; everything else sits under More. */
export const MOBILE_TABS = ['/dashboard', '/vendors', '/tasks', '/budget'] as const

/** The most specific link matching the current path, so /vendors/compare doesn't also light up Vendors. */
export function activeHref(pathname: string): string | null {
  const matches = NAV_LINKS.filter(
    (link) => pathname === link.href || pathname.startsWith(link.href + '/')
  )
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null
}
