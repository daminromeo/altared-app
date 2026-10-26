import { TrackedCTA } from "@/components/shared/tracked-cta"
import { blogCtaCopy, blogCtaHref } from "@/lib/blog/blog-ctas"
import type { PostCategory } from "@/lib/blog/types"

/** Sign-up card placed after a post's second section (see rehypeInlineCta). */
export function InlineCTA({ category }: { category: PostCategory }) {
  const copy = blogCtaCopy(category)
  return (
    <aside
      aria-label="Try Altared"
      className="not-prose my-10 flex flex-col gap-3 rounded-2xl bg-moss p-6 text-[#F1EFE8] sm:p-7"
    >
      <p className="font-display text-xl font-bold leading-tight tracking-[-0.03em] sm:text-2xl">
        {copy.title}
        <br />
        <span className="text-champagne">{copy.accent}</span>
      </p>
      <p className="max-w-[52ch] text-[15px] leading-relaxed text-[#C9D3C6]">{copy.body}</p>
      <TrackedCTA
        href={blogCtaHref(category)}
        location="blog_inline"
        className="mt-1 inline-flex min-h-11 w-fit items-center rounded-full bg-champagne px-5 font-display text-sm font-bold text-ink no-underline transition-opacity hover:opacity-90"
      >
        {copy.cta}
      </TrackedCTA>
    </aside>
  )
}
