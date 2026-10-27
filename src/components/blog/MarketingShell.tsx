import Link from "next/link"
import { TrackedCTA } from "@/components/shared/tracked-cta"

// Header and footer shared by the landing page and the blog.

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`font-display text-xl font-extrabold tracking-[-0.045em] text-ink ${className}`}
    >
      altared<span className="text-sage">.</span>
    </Link>
  )
}

export function MarketingHeader({ ctaLabel = "Start free", ctaHref = "/get-started" }) {
  return (
    <nav className="sticky top-0 z-50 border-b border-hairline bg-paper/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
        <Wordmark />
        <div className="flex items-center gap-5 md:gap-7">
          <Link href="/#how-it-works" className="hidden text-sm font-medium text-ink-muted hover:text-ink md:block">
            How it works
          </Link>
          <Link href="/#pricing" className="hidden text-sm font-medium text-ink-muted hover:text-ink md:block">
            Pricing
          </Link>
          <Link href="/blog" className="hidden text-sm font-medium text-ink-muted hover:text-ink md:block">
            Guides
          </Link>
          <Link href="/login" className="text-sm font-medium text-ink-muted hover:text-ink">
            Log in
          </Link>
          <TrackedCTA
            href={ctaHref}
            location="nav"
            className="lift inline-flex h-10 items-center rounded-full bg-moss px-4 font-display text-sm font-bold text-white transition-colors hover:bg-moss-light"
          >
            {ctaLabel}
          </TrackedCTA>
        </div>
      </div>
    </nav>
  )
}

export function MarketingFooter() {
  const columns = [
    {
      title: "Product",
      links: [
        { href: "/#how-it-works", label: "How it works" },
        { href: "/#pricing", label: "Pricing" },
        { href: "/get-started", label: "Get started" },
      ],
    },
    { title: "Guides", links: [{ href: "/blog", label: "Wedding planning blog" }] },
    {
      title: "Legal",
      links: [
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms of Service" },
      ],
    },
  ]

  return (
    <footer className="border-t border-hairline bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-[28ch] text-sm text-ink-muted">
              Vendor quotes, budget and due dates for your wedding, in one calm place.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="mb-3 text-sm font-semibold text-ink">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.href === "/get-started" ? (
                      <TrackedCTA href={link.href} location="footer" className="text-sm text-ink-muted hover:text-ink">
                        {link.label}
                      </TrackedCTA>
                    ) : (
                      <Link href={link.href} className="text-sm text-ink-muted hover:text-ink">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-12 border-t border-hairline pt-8 text-sm text-ink-muted">
          &copy; {new Date().getFullYear()} Altared. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
