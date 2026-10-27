'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MoreHorizontal } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { NAV_LINKS, MOBILE_TABS, activeHref } from '@/components/layout/nav-links'

const tabs = NAV_LINKS.filter((link) => (MOBILE_TABS as readonly string[]).includes(link.href))
const moreLinks = NAV_LINKS.filter((link) => !(MOBILE_TABS as readonly string[]).includes(link.href))

export function MobileNav() {
  const pathname = usePathname()
  const active = activeHref(pathname)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = moreLinks.some((link) => link.href === active)

  const tabClass = (isActive: boolean) =>
    cn(
      'flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10.5px] font-semibold transition-colors',
      isActive ? 'text-moss' : 'text-ink-muted active:text-ink'
    )

  return (
    <>
      <nav className="safe-area-pb fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t border-hairline bg-white/95 backdrop-blur lg:hidden">
        {tabs.map((link) => {
          const Icon = link.icon
          const isActive = link.href === active
          return (
            <Link key={link.href} href={link.href} className={tabClass(isActive)} aria-current={isActive ? 'page' : undefined}>
              <Icon className="size-5" />
              <span>{link.label}</span>
            </Link>
          )
        })}
        <button type="button" onClick={() => setMoreOpen(true)} className={tabClass(moreActive)}>
          <MoreHorizontal className="size-5" />
          <span>More</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-hairline bg-paper px-4 pb-8 pt-5">
          <SheetTitle className="px-2 font-display text-base font-bold">More</SheetTitle>
          <div className="grid gap-1">
            {moreLinks.map((link) => {
              const Icon = link.icon
              const isActive = link.href === active
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-medium',
                    isActive ? 'bg-white text-ink ring-1 ring-hairline' : 'text-ink'
                  )}
                >
                  <Icon className={cn('size-5', isActive ? 'text-moss' : 'text-ink-muted')} />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
