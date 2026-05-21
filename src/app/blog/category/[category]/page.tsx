import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  getAllPosts,
  getAllCategories,
  getPostsByCategory,
} from "@/lib/blog/posts"
import {
  CATEGORY_LABELS,
  type PostCategory,
} from "@/lib/blog/types"
import { CategoryNav } from "@/components/blog/CategoryNav"
import { PostCard } from "@/components/blog/PostCard"
import { MarketingShell } from "@/components/blog/MarketingShell"
import { BreadcrumbJsonLd } from "@/components/blog/JsonLd"

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://altared.app"
).replace(/\/$/, "")

export const revalidate = 3600

export function generateStaticParams() {
  return getAllCategories().map(({ category }) => ({ category }))
}

const VALID_CATEGORIES = new Set<PostCategory>(
  Object.keys(CATEGORY_LABELS) as PostCategory[]
)

function isPostCategory(value: string): value is PostCategory {
  return VALID_CATEGORIES.has(value as PostCategory)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  if (!isPostCategory(category)) return { title: "Not found" }
  const label = CATEGORY_LABELS[category]
  return {
    title: `${label} — Wedding Planning Resources | Altared`,
    description: `Articles, tips, and guides about ${label.toLowerCase()} for couples planning their wedding.`,
    alternates: { canonical: `${SITE_URL}/blog/category/${category}` },
    openGraph: {
      title: `${label} — Wedding Planning Resources`,
      description: `Articles, tips, and guides about ${label.toLowerCase()}.`,
      url: `${SITE_URL}/blog/category/${category}`,
      type: "website",
    },
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  if (!isPostCategory(category)) notFound()

  const posts = getPostsByCategory(category)
  if (posts.length === 0) notFound()

  const allPosts = getAllPosts()
  const categories = getAllCategories()
  const label = CATEGORY_LABELS[category]

  return (
    <MarketingShell>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Resources", url: "/blog" },
          { name: label, url: `/blog/category/${category}` },
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
            /{" "}
            <Link href="/blog" className="hover:text-[#2D2D2D]">
              Resources
            </Link>{" "}
            / <span className="text-[#2D2D2D]">{label}</span>
          </nav>
          <h1
            className="text-4xl font-bold tracking-tight text-[#2D2D2D] md:text-5xl"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            {label}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#5A5A5A] md:text-lg">
            {posts.length} {posts.length === 1 ? "post" : "posts"} on{" "}
            {label.toLowerCase()}.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8">
          <CategoryNav
            categories={categories}
            active={category}
            totalCount={allPosts.length}
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
