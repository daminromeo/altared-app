import Link from "next/link"

export function BlogCTA() {
  return (
    <aside
      className="not-prose my-12 overflow-hidden rounded-2xl border border-[#E8E4DE] bg-gradient-to-br from-[#FAF8F5] to-white p-8 md:p-10"
      aria-label="Try Altared"
    >
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h3
            className="text-2xl font-semibold text-[#2D2D2D] md:text-3xl"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Plan your wedding smarter
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#5A5A5A] md:text-base">
            Compare vendors, scan proposals with AI, and keep your budget on
            track — all in one place. Free to start, no credit card required.
          </p>
        </div>
        <Link
          href="/get-started"
          className="inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-lg bg-[#8B9F82] px-6 text-sm font-medium text-white transition-colors hover:bg-[#7A8E71]"
        >
          Try Altared free
        </Link>
      </div>
    </aside>
  )
}
