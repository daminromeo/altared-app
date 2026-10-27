import type { Metadata } from "next"
import Link from "next/link"
import { getAllPosts, getAllCategories } from "@/lib/blog/posts"
import { CategoryNav } from "@/components/blog/CategoryNav"
import { SearchableGrid } from "@/components/blog/SearchBox"
import { MarketingShell } from "@/components/blog/MarketingShell"
import { BreadcrumbJsonLd } from "@/components/blog/JsonLd"

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://altared.app"
).replace(/\/$/, "")

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Wedding Blog: Planning Tips & Vendor Advice | Altared",
  description:
    "Honest, practical wedding-planning advice from Altared — vendor tips, hidden costs to watch for, budgeting frameworks, and contract red flags.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "Wedding Blog: Planning Tips & Vendor Advice",
    description:
      "Practical wedding-planning advice — vendor tips, hidden costs, budgeting, and contract red flags.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wedding Blog: Planning Tips & Vendor Advice | Altared",
    description:
      "Practical wedding-planning advice — vendor tips, hidden costs, budgeting, and contract red flags.",
  },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()
  const categories = getAllCategories()

  return (
    <MarketingShell>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
        ]}
      />

      <section className="border-b border-hairline/60 bg-gradient-to-b from-white to-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 text-sm text-ink-muted"
          >
            <Link href="/" className="hover:text-ink">
              Home
            </Link>{" "}
            / <span className="text-ink">Blog</span>
          </nav>
          <h1
            className="text-4xl font-bold tracking-tight text-ink md:text-5xl"
            style={{ fontFamily: "var(--font-manrope), sans-serif" }}
          >
            Wedding planning, decoded.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#5A5A5A] md:text-lg">
            Practical tips, real vendor red flags, and the budget breakdowns we
            wish we&apos;d seen before signing a single contract.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline bg-white p-16 text-center">
            <h2
              className="text-xl font-semibold text-ink"
              style={{ fontFamily: "var(--font-manrope), sans-serif" }}
            >
              New posts coming soon
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              We&apos;re cooking up our first batch of wedding-planning guides.
              Check back shortly.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <CategoryNav
              categories={categories}
              totalCount={posts.length}
            />
            <SearchableGrid posts={posts} />
          </div>
        )}
      </section>
    </MarketingShell>
  )
}
