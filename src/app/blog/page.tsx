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
  title: "Wedding Resources & Planning Tips | Altared",
  description:
    "Honest, practical wedding-planning advice from Altared — vendor tips, hidden costs to watch for, budgeting frameworks, and contract red flags.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "Wedding Resources & Planning Tips",
    description:
      "Practical wedding-planning advice — vendor tips, hidden costs, budgeting, and contract red flags.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wedding Resources & Planning Tips | Altared",
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
          { name: "Resources", url: "/blog" },
        ]}
      />

      <section className="border-b border-[#E8E4DF]/60 bg-gradient-to-b from-white to-[#FAF8F5]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 text-sm text-[#7A7A7A]"
          >
            <Link href="/" className="hover:text-[#2D2D2D]">
              Home
            </Link>{" "}
            / <span className="text-[#2D2D2D]">Resources</span>
          </nav>
          <h1
            className="text-4xl font-bold tracking-tight text-[#2D2D2D] md:text-5xl"
            style={{ fontFamily: "var(--font-playfair), serif" }}
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
          <div className="rounded-2xl border border-dashed border-[#E8E4DE] bg-white p-16 text-center">
            <h2
              className="text-xl font-semibold text-[#2D2D2D]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              New posts coming soon
            </h2>
            <p className="mt-2 text-sm text-[#7A7A7A]">
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
