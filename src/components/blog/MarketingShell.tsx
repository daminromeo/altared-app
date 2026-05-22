import Link from "next/link"

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}

function MarketingHeader() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[#E8E4DF]/60 bg-[#FAF8F5]/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B9F82]">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <span
            className="text-xl font-bold text-[#2D2D2D]"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Altared
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/#features"
            className="text-sm font-medium text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
          >
            Features
          </Link>
          <Link
            href="/#pricing"
            className="text-sm font-medium text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
          >
            Pricing
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
          >
            Blog
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
          >
            Sign In
          </Link>
          <Link
            href="/get-started"
            className="inline-flex h-9 items-center rounded-lg bg-[#8B9F82] px-4 text-sm font-medium text-white transition-colors hover:bg-[#7A8E71]"
          >
            Get Started
          </Link>
        </div>

        <Link
          href="/get-started"
          className="inline-flex h-9 items-center rounded-lg bg-[#8B9F82] px-4 text-sm font-medium text-white transition-colors hover:bg-[#7A8E71] md:hidden"
        >
          Get Started
        </Link>
      </div>
    </nav>
  )
}

function MarketingFooter() {
  return (
    <footer className="border-t border-[#E8E4DF]/60 bg-[#FAF8F5]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#8B9F82]">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <span
                className="text-lg font-bold text-[#2D2D2D]"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                Altared
              </span>
            </Link>
            <p className="mt-3 text-sm text-[#7A7A7A]">
              Wedding vendor management, simplified.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-[#2D2D2D]">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/#features"
                  className="text-sm text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/#pricing"
                  className="text-sm text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/get-started"
                  className="text-sm text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-[#2D2D2D]">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
                >
                  Wedding Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-[#2D2D2D]">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-[#E8E4DF] pt-8 text-center">
          <p className="text-sm text-[#7A7A7A]">
            &copy; {new Date().getFullYear()} Altared. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
