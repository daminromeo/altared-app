'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  BookOpen,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  CalendarCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useState } from 'react'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendors', label: 'Vendors', icon: Users },
  { href: '/tasks', label: 'Tasks', icon: CalendarCheck },
  { href: '/proposals', label: 'Proposals', icon: FileText },
  { href: '/budget', label: 'Budget', icon: DollarSign },
  { href: '/messages', label: 'Comm Log', icon: BookOpen },
  { href: '/settings', label: 'Profile & Settings', icon: Settings },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-border bg-white transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span
              className="text-xl font-bold tracking-tight text-[#8B9F82]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Altared
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-[#7A7A7A] hover:text-[#2D2D2D]"
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </Button>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + '/')
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#8B9F82]/10 text-[#8B9F82]'
                  : 'text-[#7A7A7A] hover:bg-[#FAF8F5] hover:text-[#2D2D2D]',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? link.label : undefined}
            >
              <Icon
                className={cn(
                  'size-5 shrink-0',
                  isActive ? 'text-[#8B9F82]' : 'text-[#7A7A7A]'
                )}
              />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-4">
        {!collapsed && (
          <div className="rounded-lg bg-[#FAF8F5] p-3">
            <p className="text-xs font-medium text-[#2D2D2D]">Need help?</p>
            <p className="mt-1 text-xs text-[#7A7A7A]">
              Check our guide for tips on managing your vendors.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
