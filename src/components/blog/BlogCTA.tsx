import { TrackedCTA } from "@/components/shared/tracked-cta"
import { blogCtaCopy, blogCtaHref } from "@/lib/blog/blog-ctas"
import type { PostCategory } from "@/lib/blog/types"

/** End-of-post sign-up card, matched to the post's category. */
export function BlogCTA({ category }: { category: PostCategory }) {
  const copy = blogCtaCopy(category)
  return (
    <aside
      className="not-prose my-12 rounded-2xl border border-hairline bg-paper p-7 md:p-10"
      aria-label="Try Altared"
    >
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h3 className="font-display text-2xl font-bold leading-tight tracking-[-0.035em] text-ink md:text-3xl">
            {copy.title}
            <br />
            <span className="text-moss-light">{copy.accent}</span>
          </h3>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{copy.body}</p>
        </div>
        <TrackedCTA
          href={blogCtaHref(category)}
          location="blog_footer"
          className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-moss px-6 font-display text-sm font-bold text-white transition-colors hover:bg-moss-light"
        >
          {copy.cta}
        </TrackedCTA>
      </div>
    </aside>
  )
}
