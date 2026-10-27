'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { NAV_LINKS, activeHref } from '@/components/layout/nav-links'
import { TrialStatus } from '@/components/layout/trial-status'

export function Sidebar() {
  const pathname = usePathname()
  const active = activeHref(pathname)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-hairline bg-paper transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[232px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <Link
            href="/dashboard"
            className="px-1 font-display text-xl font-extrabold tracking-[-0.045em] text-ink"
          >
            altared<span className="text-sage">.</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-ink-muted hover:text-ink"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {NAV_LINKS.map((link) => {
          const isActive = link.href === active
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-hairline'
                  : 'text-ink-muted hover:bg-white/60 hover:text-ink',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? link.label : undefined}
            >
              <Icon className={cn('size-[18px] shrink-0', isActive ? 'text-moss' : 'text-ink-muted')} />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-hairline p-4">
          <TrialStatus />
        </div>
      )}
    </aside>
  )
}
