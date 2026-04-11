'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  DollarSign,
  MoreHorizontal,
} from 'lucide-react'

const mobileNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendors', label: 'Vendors', icon: Users },
  { href: '/tasks', label: 'Tasks', icon: CalendarCheck },
  { href: '/budget', label: 'Budget', icon: DollarSign },
  { href: '/settings', label: 'More', icon: MoreHorizontal },
] as const

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t border-border bg-white lg:hidden safe-area-pb">
      {mobileNavLinks.map((link) => {
        const isActive =
          pathname === link.href || pathname.startsWith(link.href + '/')
        const Icon = link.icon

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[44px] px-2 py-1 text-[10px] sm:text-xs font-medium transition-colors',
              isActive
                ? 'text-[#8B9F82]'
                : 'text-[#7A7A7A] active:text-[#2D2D2D]'
            )}
          >
            <Icon
              className={cn(
                'size-5',
                isActive ? 'text-[#8B9F82]' : 'text-[#7A7A7A]'
              )}
            />
            <span className="truncate">{link.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
