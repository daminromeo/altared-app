import Link from "next/link"
import { format } from "date-fns"
import { CATEGORY_LABELS, type PostMeta } from "@/lib/blog/types"

export function RelatedPosts({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) return null
  return (
    <section className="not-prose mt-16 border-t border-hairline pt-12">
      <h2
        className="mb-6 text-2xl font-semibold text-ink"
        style={{ fontFamily: "var(--font-manrope), sans-serif" }}
      >
        Keep reading
      </h2>
      <ul className="grid gap-6 sm:grid-cols-3">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="group flex flex-col gap-2"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-moss">
                {CATEGORY_LABELS[p.category]}
              </span>
              <span
                className="text-base font-semibold leading-snug text-ink group-hover:text-[#6B8F71]"
                style={{ fontFamily: "var(--font-manrope), sans-serif" }}
              >
                {p.title}
              </span>
              <span className="text-xs text-ink-muted">
                {format(new Date(p.publishedAt), "MMM d, yyyy")} ·{" "}
                {p.readingMinutes} min read
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
