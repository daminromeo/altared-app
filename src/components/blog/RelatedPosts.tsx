import Link from "next/link"
import { format } from "date-fns"
import { CATEGORY_LABELS, type PostMeta } from "@/lib/blog/types"

export function RelatedPosts({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) return null
  return (
    <section className="not-prose mt-16 border-t border-[#E8E4DE] pt-12">
      <h2
        className="mb-6 text-2xl font-semibold text-[#2D2D2D]"
        style={{ fontFamily: "var(--font-playfair), serif" }}
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
              <span className="text-xs font-medium uppercase tracking-wide text-[#8B9F82]">
                {CATEGORY_LABELS[p.category]}
              </span>
              <span
                className="text-base font-semibold leading-snug text-[#2D2D2D] group-hover:text-[#6B8F71]"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                {p.title}
              </span>
              <span className="text-xs text-[#7A7A7A]">
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
